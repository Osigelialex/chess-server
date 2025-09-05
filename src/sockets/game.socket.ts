import { Socket, Namespace } from "socket.io";
import { chessConstants } from "../utils/constants";
import { redisClient } from "../config/redis.config";
import prisma from "../config/db.config";
import { Chess } from "chess.js";

const gameSocket = (io: Namespace, socket: Socket) => {

  /**
   * Helper function to update cached game state
   */
  const updateCachedGame = async (gameId: string, updates: any) => {
    const cachedGame = await redisClient.get(`game:${gameId}`);
    if (cachedGame) {
      const game = JSON.parse(cachedGame);
      const updatedGame = { ...game, ...updates };
      await redisClient.set(`game:${gameId}`, JSON.stringify(updatedGame), 'EX', 1800);
      return updatedGame;
    }
    return null;
  };

  /**
   * Helper function to reconcile cached game with database when game ends
   */
  const reconcileGameOnEnd = async (gameId: string, finalUpdates: any) => {
    const cachedGame = await redisClient.get(`game:${gameId}`);
    if (cachedGame) {
      const game = JSON.parse(cachedGame);
      
      // Update database with final game state
      await prisma.game.update({
        where: { id: gameId },
        data: {
          boardState: game.boardState,
          moves: game.moves,
          ...finalUpdates
        }
      });

      await redisClient.del(`game:${gameId}`);
    }
  };

  /**
   * Handles the playerReady event.
   * This event is triggered when a player indicates they are ready to play.
   * If both players are ready, the game is started.
   */
  socket.on('playerReady', async (data: { gameId: string }) => {
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

      socket.join(gameId);
      socket.emit("ready", { message: 'You are ready to play' });

      // verify if both players are ready and start the game
      const sockets = await io.in(gameId).fetchSockets();
      if (sockets.length === 2) {
        socket.emit("gameStarted", { message: "Game has started" });
      }
    } catch (err: any) {
      socket.emit("gameError", { message: "Something unexpected happened when player was ready" });
    }
  });

  /**
   * Handles the move event.
   * Validates the move, updates the cached game state, and notifies players.
   * Only reconciles with database when game ends.
   */
  socket.on('move', async (data: { gameId: string, move: string }) => {
    try {
      const { gameId, move } = data;
      const cachedGame = await redisClient.get(`game:${gameId}`);
      
      if (!cachedGame || !socket.rooms.has(gameId)) {
        socket.emit("gameError", { message: 'Game has expired' });
        return;
      }

      const game = JSON.parse(cachedGame);

      const userId = socket.data.userId;
      if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
        socket.emit("gameError", { message: 'You are not a player in this game' });
        return;
      }

      let chess: Chess;

      try {
        chess = new Chess(game.boardState);
      } catch (err: any) {
        socket.emit("gameError", { message: 'Invalid board state' });
        return;
      }

      const playerTurn = chess.turn();
      if ((playerTurn === 'w' && userId !== game.whitePlayerId) ||
          (playerTurn === 'b' && userId !== game.blackPlayerId)) {
        socket.emit("gameError", { message: 'It is not your turn to move' });
        return;
      }

      try {
        chess.move(move, { strict: true });
      } catch (err: any) {
        socket.emit("gameError", { message: 'Invalid move' });
        return;
      }

      // Update cached game state
      const updatedGameMoves = game.moves === null ? move : game.moves + ` ${move}`;
      await updateCachedGame(gameId, {
        boardState: chess.fen(),
        moves: updatedGameMoves
      });

      // Check for game ending conditions
      if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition()) {
        await reconcileGameOnEnd(gameId, {
          result: 'DRAW'
        });

        io.to(gameId).emit("gameEnded", {
          message: `Game has ended in a draw`,
          boardState: chess.fen()
        });

        io.in(gameId).socketsLeave(gameId);
        return;
      }

      if (chess.isCheckmate()) {
        const winnerId = chess.turn() === 'w' ? game.blackPlayerId : game.whitePlayerId;
        const loserId = chess.turn() === 'w' ? game.whitePlayerId : game.blackPlayerId;

        if (!winnerId || !loserId) {
          socket.emit("gameError", { message: "Winner or loser not found" });
          return;
        }

        const [winner, loser] = await Promise.all([
          prisma.user.findUnique({ where: { id: winnerId }}),
          prisma.user.findUnique({ where: { id: loserId }})
        ]);

        if (!winner || !loser) {
          socket.emit("gameError", { message: "Winner or loser not found" });
          return;
        }

        const newWinnerRating = Math.min(
          winner.rating + chessConstants.RATING_INCREMENT, chessConstants.MAX_ELO_RATING);
        const newLoserRating = Math.max(
          loser.rating - chessConstants.RATING_INCREMENT, chessConstants.MIN_ELO_RATING);

        await prisma.$transaction([
          // Reconcile game state with database
          prisma.game.update({
            where: { id: gameId },
            data: {
              boardState: chess.fen(),
              moves: updatedGameMoves,
              result: 'CHECKMATE',
              winner: { connect: { id: winnerId }}
            }
          }),
          prisma.user.update({
            where: { id: winnerId },
            data: {
              rating: newWinnerRating
            }
          }),
          prisma.user.update({
            where: { id: loserId },
            data: {
              rating: newLoserRating
            }
          })
        ]);

        // Remove from cache
        await redisClient.del(`game:${gameId}`);

        io.to(gameId).emit("moveMade", {
          move,
          boardState: chess.fen(),
          playerTurn: chess.turn(),
          playerChecked: chess.inCheck()
        });

        io.to(gameId).emit("gameEnded", {
          message: `${winner.username} won the game by checkmate!`,
          boardState: chess.fen(),
          winnerRating: newWinnerRating,
          loserRating: newLoserRating
        });

        io.in(gameId).socketsLeave(gameId);
      } else {
        io.to(gameId).emit("moveMade", {
          move,
          boardState: chess.fen(),
          playerTurn: chess.turn(),
          playerChecked: chess.inCheck()
        });
      }
    } catch (err: any) {
      socket.emit("gameError", { message: 'Something unexpected happened when processing the move' });
    }
  });

  /**
   * Handles resigning from a game.
   * When a user resigns, they are removed from the room and the game data is reconciled with database.
   * The other player is marked as the winner, and the ratings of both players are updated
   */
  socket.on('resign', async (data: { gameId: string }) => {
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
            winner: { connect: { id: otherPlayerId }}
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
  });

  /**
   * Handles the draw offer event.
   * This event is triggered when a player offers a draw.
   * It checks if the game exists, if the user is a player in that game,
   * and if the game is active. If all conditions are met, it sets a draw offer
   * in Redis and emits a 'drawOffer' event to all players in the game room.
  */
  socket.on('drawOffer', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const cachedGame = await redisClient.get(`game:${gameId}`);
      if (!cachedGame) {
        socket.emit('gameError', { message: 'Game has expired' });
        return;
      }

      const game = JSON.parse(cachedGame);
      if (game.status !== 'ACTIVE' || !socket.rooms.has(gameId)) {
        socket.emit('gameError', { message: 'Game is not active' });
        return;
      }

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

      await redisClient.set(`drawOffer:${gameId}`, userId, 'EX', chessConstants.DRAW_OFFER_TIMEOUT);

      io.to(gameId).emit("drawOffer", {
        message: `${user.username} has offered a draw`,
      });

    } catch (err: any) {
      socket.emit('gameError', { message: 'Something unexpected happened when offering a draw' });
    }
  });

  /**
   * Handles accepting a draw offer.
   * This event is triggered when a player accepts a draw offer.
   * It reconciles the cached game state with the database and ends the game.
   */
  socket.on('acceptDraw', async (data: { gameId: string }) => {
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

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      socket.emit("gameError", { message: "User not found" });
      return;
    }

    const drawOffer = await redisClient.get(`drawOffer:${gameId}`);
    if (!drawOffer) {
      socket.emit('gameError', { message: 'No draw offer found' });
      return;
    }

    await reconcileGameOnEnd(gameId, {
      result: 'DRAW'
    });

    await redisClient.del(`drawOffer:${gameId}`);

    io.to(gameId).emit("drawAccepted", {
      message: `Draw accepted by ${user.username}`,
    });

    io.to(gameId).emit("gameEnded", {
      message: `Game has ended in a draw`,
    });

    io.in(gameId).socketsLeave(gameId);
  });

  /**
   * Handles rejecting a draw offer.
   * This event is triggered when a player rejects a draw offer.
   * It checks if the game exists, if the user is a player in that game,
   * and if the game is active. If all conditions are met, it removes the draw offer from Redis
   * and emits a 'drawRejected' event to all players in the game room.
   */
  socket.on('rejectDraw', async (data: { gameId: string }) => {
    const { gameId } = data;
    const cachedGame = await redisClient.get(`game:${gameId}`);
    if (!cachedGame) {
      socket.emit("gameError", { message: 'Game has expired' });
      return;
    }
    
    const game = JSON.parse(cachedGame);
    if (game.status !== 'ACTIVE' || !socket.rooms.has(gameId)) {
      socket.emit('gameError', { message: 'Game is not active' });
      return;
    }

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

    io.to(gameId).emit("drawRejected", {
      message: `Draw offer rejected by ${user.username}`,
    });
  });
};

export default gameSocket;
