import { Namespace, Socket } from "socket.io";
import { redisClient } from "../config/redis.config";
import prisma from "../config/db.config";
import { Chess } from "chess.js";
import { reconcileGameOnEnd, updateCachedGame } from "../utils/helpers";
import { chessConstants } from "../utils/constants";

export const handlePlayerReady = async (io: Namespace, socket: Socket, data: { gameId: string }) => {
  try {
    const { gameId } = data;
    const cachedGame = await redisClient.get(`game:${gameId}`);

    if (!cachedGame) {
      socket.emit("gameError", { message: 'Game has expired' });
      return;
    }

    const game = JSON.parse(cachedGame);
    const userId = socket.data.userId;

    if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
      socket.emit("gameError", { message: 'You are not a player in this game' });
      return;
    }

    await socket.join(gameId);

    if (userId === game.blackPlayerId) {
      game.blackPlayerReady = true;
    } else if (userId === game.whitePlayerId) {
      game.whitePlayerReady = true;
    }

    await redisClient.set(`game:${gameId}`, JSON.stringify(game));

    socket.emit("ready", { message: 'You are ready to play' });
    if (game.whitePlayerReady && game.blackPlayerReady) {
      io.to(gameId).emit("gameStarted", { message: 'Game started', game });
    }
  } catch (err: any) {
    socket.emit("gameError", { message: "Something unexpected happened when player was ready" });
  }
}

export const handleMove = async (
  io: Namespace,
  socket: Socket,
  { gameId, move }: { gameId: string; move: string }
) => {
  try {
    const cachedGame = await redisClient.get(`game:${gameId}`);
    if (!cachedGame || !socket.rooms.has(gameId)) {
      return socket.emit("gameError", { message: "Game has expired" });
    }

    const game = JSON.parse(cachedGame);
    const userId = socket.data.userId;
    if (![game.whitePlayerId, game.blackPlayerId].includes(userId)) {
      return socket.emit("gameError", { message: "You are not a player in this game" });
    }

    let chess: Chess;
    try {
      chess = new Chess(game.boardState);
    } catch {
      return socket.emit("gameError", { message: "Invalid board state" });
    }

    if (
      (chess.turn() === "w" && userId !== game.whitePlayerId) ||
      (chess.turn() === "b" && userId !== game.blackPlayerId)
    ) {
      return socket.emit("gameError", { message: "It is not your turn" });
    }

    try {
      chess.move(move, { strict: true });
    } catch {
      return socket.emit("gameError", { message: "Invalid move" });
    }

    const updatedMoves = game.moves ? `${game.moves} ${move}` : move;
    await updateCachedGame(gameId, {
      boardState: chess.fen(),
      moves: updatedMoves,
    });

    if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition()) {
      await handleDraw(io, socket, gameId, chess);
      return;
    }

    if (chess.isCheckmate()) {
      await handleCheckmate(io, socket, gameId, game, chess, updatedMoves, move);
      return;
    }

    io.to(gameId).emit("moveMade", {
      move,
      boardState: chess.fen(),
      playerTurn: chess.turn(),
      playerChecked: chess.inCheck(),
    });
  } catch {
    socket.emit("gameError", {
      message: "Something unexpected happened when processing the move",
    });
  }
};

const handleDraw = async (io: Namespace, socket: Socket, gameId: string, chess: Chess) => {
  await reconcileGameOnEnd(
    gameId,
    { result: "DRAW" },
    socket.nsp.name
  );

  io.to(gameId).emit("gameEnded", {
    message: "Game ended in a draw",
    boardState: chess.fen(),
  });

  io.in(gameId).socketsLeave(gameId);
}

const handleCheckmate = async (
  io: Namespace,
  socket: Socket,
  gameId: string,
  game: any,
  chess: Chess,
  updatedMoves: string,
  move: string
) => {
  if (socket.nsp.name === "/auth") {
    await reconcileCheckmateWithRatings(io, socket, gameId, game, chess, updatedMoves, move);
  } else if (socket.nsp.name === "/guest") {
    await notifyGuestCheckmate(io, socket, gameId);
  }

  io.in(gameId).socketsLeave(gameId);
}

const reconcileCheckmateWithRatings = async (
  io: Namespace,
  socket: Socket,
  gameId: string,
  game: any,
  chess: Chess,
  updatedMoves: string,
  move: string
) => {
  const winnerId = chess.turn() === "w" ? game.blackPlayerId : game.whitePlayerId;
  const loserId = chess.turn() === "w" ? game.whitePlayerId : game.blackPlayerId;

  if (!winnerId || !loserId) {
    return socket.emit("gameError", { message: "Winner or loser not found" });
  }

  const [winner, loser] = await Promise.all([
    prisma.user.findUnique({ where: { id: winnerId } }),
    prisma.user.findUnique({ where: { id: loserId } }),
  ]);

  if (!winner || !loser) {
    return socket.emit("gameError", { message: "Winner or loser not found" });
  }

  const newWinnerRating = Math.min(
    winner.rating + chessConstants.RATING_INCREMENT,
    chessConstants.MAX_ELO_RATING
  );
  const newLoserRating = Math.max(
    loser.rating - chessConstants.RATING_INCREMENT,
    chessConstants.MIN_ELO_RATING
  );

  await prisma.$transaction([
    prisma.game.update({
      where: { id: gameId },
      data: {
        boardState: chess.fen(),
        moves: updatedMoves,
        result: "CHECKMATE",
        winner: { connect: { id: winnerId } },
      },
    }),
    prisma.user.update({ where: { id: winnerId }, data: { rating: newWinnerRating } }),
    prisma.user.update({ where: { id: loserId }, data: { rating: newLoserRating } }),
  ]);

  await redisClient.del(`game:${gameId}`);

  io.to(gameId).emit("moveMade", {
    move,
    boardState: chess.fen(),
    playerTurn: chess.turn(),
    playerChecked: chess.inCheck(),
  });

  io.to(gameId).emit("gameEnded", {
    message: `${winner.username} won the game by checkmate!`,
    boardState: chess.fen(),
    winnerRating: newWinnerRating,
    loserRating: newLoserRating,
  });
}

const notifyGuestCheckmate = async (io: Namespace, socket: Socket, gameId: string) => {
  await reconcileGameOnEnd(
    gameId,
    { result: "CHECKMATE" },
    socket.nsp.name
  );

  socket.to(gameId).emit("gameEnded", {
    message: `Checkmate! You have been defeated.`,
  });
  socket.emit("gameEnded", {
    message: `Congratulations! You won by checkmate.`,
  });
}

export const resignAuth = async (io: Namespace, socket: Socket, data: { gameId: string }) => {
  try {
    const { gameId } = data;
    const cachedGame = await redisClient.get(`game:${gameId}`);

    if (!cachedGame || !socket.rooms.has(gameId)) {
      socket.emit('gameError', { message: 'Game not found' });
      return;
    }

    const game = JSON.parse(cachedGame);
    const userId = socket.data.userId;
    if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
      socket.emit("gameError", { message: 'You are not a player in this game' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      socket.emit("gameError", { message: "User not found" });
      return;
    }

    const otherPlayerId = game.blackPlayerId === userId ? game.whitePlayerId : game.blackPlayerId;
    if (!otherPlayerId) {
      socket.emit("gameError", { message: "Opponent not found" });
      return;
    }

    const otherPlayer = await prisma.user.findUnique({
      where: { id: otherPlayerId }
    });

    if (!otherPlayer) {
      socket.emit("gameError", { message: "Opponent not found" });
      return;
    }

    const newRating = Math.max(user.rating - 20, 100);

    await prisma.$transaction([
      // Reconcile final game state
      prisma.game.update({
        where: { id: gameId },
        data: {
          boardState: game.boardState,
          moves: game.moves,
          result: "RESIGN",
          winner: { connect: { id: otherPlayerId } }
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          rating: newRating
        }
      }),
      prisma.user.update({
        where: { id: otherPlayerId },
        data: {
          rating: { increment: chessConstants.RATING_INCREMENT }
        }
      })
    ]);

    // Remove from cache
    await redisClient.del(`game:${gameId}`);

    io.to(gameId).emit("resigned", {
      message: `${user.username} has resigned`,
      newRating: newRating
    });

    io.to(gameId).emit("gameEnded", {
      message: `Game has ended. ${user.username} resigned. ${otherPlayer.username} is the winner.`,
    });

    io.in(gameId).socketsLeave(gameId);

  } catch (err: any) {
    socket.emit('gameError', { message: 'Something unexpected happened when resigning from the game' });
  }
}

export const resignGuest = async (io: Namespace, socket: Socket, data: { gameId: string }) => {
  try {
    const { gameId } = data;
    const cachedGame = await redisClient.get(`game:${gameId}`);

    if (!cachedGame || !socket.rooms.has(gameId)) {
      socket.emit('gameError', { message: 'Game not found' });
      return;
    }

    const game = JSON.parse(cachedGame);
    const userId = socket.data.userId;
    if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
      socket.emit("gameError", { message: 'You are not a player in this game' });
      return;
    }

    await prisma.$transaction([
      prisma.guestGame.update({
        where: { id: gameId },
        data: {
          boardState: game.boardState,
          moves: game.moves,
          result: "RESIGN",
        }
      }),
    ]);

    await redisClient.del(`game:${gameId}`);
    socket.to(gameId).emit('gameEnded', { message: 'Your opponent has resigned. You win!' })

    socket.emit("gameEnded", {
      message: `You have resigned from the game.`
    });

    io.in(gameId).socketsLeave(gameId);

  } catch (err: any) {
    socket.emit('gameError', { message: 'Something unexpected happened when resigning from the game' });
  }
}

export const drawOffer = async (io: Namespace, socket: Socket, data: { gameId: string }) => {
  try {
    const { gameId } = data;
    const cachedGame = await redisClient.get(`game:${gameId}`);
    if (!cachedGame) {
      socket.emit('gameError', { message: 'Game has expired' });
      return;
    }

    const game = JSON.parse(cachedGame);
    const userId = socket.data.userId;

    if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
      socket.emit("gameError", { message: 'You are not a player in this game' });
      return;
    }

    await redisClient.set(`drawOffer:${gameId}`, userId, 'EX', chessConstants.DRAW_OFFER_TIMEOUT);
    socket.to(gameId).emit("drawOffer", { message: "You have been offered a draw" });

  } catch (err: any) {
    socket.emit('gameError', { message: 'Something unexpected happened when offering a draw' });
  }
}

export const acceptDraw = async (io: Namespace, socket: Socket, data: { gameId: string }) => {
  const { gameId } = data;
  const cachedGame = await redisClient.get(`game:${gameId}`);
  if (!cachedGame || !socket.rooms.has(gameId)) {
    socket.emit('gameError', { message: 'Game has expired' });
    return;
  }

  const game = JSON.parse(cachedGame);
  const userId = socket.data.userId;

  if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
    socket.emit("gameError", { message: 'You are not a player in this game' });
    return;
  }

  const drawOffer = await redisClient.get(`drawOffer:${gameId}`);
  if (!drawOffer) {
    socket.emit('gameError', { message: 'No draw offer found' });
    return;
  }

  await reconcileGameOnEnd(gameId, {
    result: 'DRAW'
  }, socket.nsp.name);

  await redisClient.del(`drawOffer:${gameId}`);
  socket.to(gameId).emit("drawAccepted", { message: "Draw accepted" });

  io.to(gameId).emit("gameEnded", {
    message: `Game has ended in a draw`,
  });

  io.in(gameId).socketsLeave(gameId);
}

export const rejectDraw = async (io: Namespace, socket: Socket, data: { gameId: string }) => {
  const { gameId } = data;
  const cachedGame = await redisClient.get(`game:${gameId}`);
  if (!cachedGame) {
    socket.emit("gameError", { message: 'Game has expired' });
    return;
  }

  const game = JSON.parse(cachedGame);
  const userId = socket.data.userId;

  if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
    socket.emit("gameError", { message: 'You are not a player in this game' });
    return;
  }

  const drawOffer = await redisClient.get(`drawOffer:${gameId}`);
  if (!drawOffer) {
    socket.emit('gameError', { message: 'No draw offer found' });
    return;
  }

  if (drawOffer === userId) {
    socket.emit('gameError', { message: 'You cannot reject your own draw offer' });
    return;
  }

  await redisClient.del(`drawOffer:${gameId}`);

  socket.to(gameId).emit("drawRejected", { message: "Draw rejected" });
}