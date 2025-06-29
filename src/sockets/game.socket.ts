import { Server, Socket } from "socket.io";
import { chessConstants } from "../utils/constants";
import prisma from "../database";

const gameSocket = (io: Server, socket: Socket) => {

  /**
   * Handles the player ready event for a game.
   * This event is triggered when a player indicates they are ready to play.
   * It checks if the game exists and if the user is a player in that game.
   * If the game is found and the user is a player, it joins the socket to the game room
   * and emits a 'ready' event back to the player.
   */
  socket.on('playerReady', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const game = await prisma.game.findUnique({ where: { id: gameId }});
      if (!game) {
        socket.emit("gameError", { message: 'Game not found' });
        return;
      }

      const userId = socket.data.userId;
      if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
        socket.emit("gameError", { message: 'You are not a player in this game' });
        return;
      }

      socket.join(gameId);
      socket.emit("ready", { message: 'You are ready to play' });
    } catch (err: any) {
      socket.emit("gameError", { message: "Something unexpected happened when player was ready" });
    }
  });

  /**
   * Handles the start game event.
   * This event is triggered when both players are ready to start the game.
   * It checks if the game exists, if the user is a player in that game,
   * and if both players are ready. If all conditions are met, it emits a 'gameStarted' event
   * to all players in the game room.
   */
  socket.on('startGame', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const game = await prisma.game.findUnique({ where: { id: gameId }});
      if (!game) {
        socket.emit("gameError", { message: 'Game not found' });
        return;
      }

      const userId = socket.data.userId;
      if (userId !== game?.blackPlayerId && userId !== game?.whitePlayerId) {
        socket.emit("gameError", { message: 'You are not a player in this game' });
        return;
      }

      const socketIds = await io.in(gameId).fetchSockets();
      if (socketIds.length < 2) {
        socket.emit("gameError", { message: 'Both players must be ready to start the game' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId }});
      if (!user) {
        socket.emit("gameError", { message: "User not found" });
        return;
      }

      await prisma.game.update({
        where: { id: gameId},
        data: {
          status: 'ACTIVE'
        }
      });

      io.to(gameId).emit("gameStarted", { message: `Game has been started by ${user.username}` });
    } catch (err: any) {
      socket.emit("gameError", { message: "Something unexpected happened when starting the game" });
    }
  });

  /**
   * Handles resigning from a game.
   * When a user resigns, they are removed from the room and the game data is updated.
   * The other player is marked as the winner, and the ratings of both players are updated
   */
  socket.on('resign', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const game = await prisma.game.findUnique({ where: { id: gameId }});
      if (!game) {
        socket.emit('gameError', { message: 'Game not found' });
        return;
      }

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

      const otherPlayerId = game.blackPlayerId === userId ? game.whitePlayerId : game.blackPlayerId;
      if (!otherPlayerId) {
        socket.emit("gameError", { message: "Opponent not found" });
        return;
      }

      const newRating = Math.max(user.rating - 20, 100);

      await prisma.$transaction([
        prisma.game.update({
          where: { id: gameId },
          data: {
            status: "RESIGN",
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

      io.to(gameId).emit("resigned", {
        message: `${user.username} has resigned`,
        newRating: newRating
      });

      socket.leave(gameId);

    } catch (err: any) {
      socket.emit('gameError', { message: 'Something unexpected happened when resigning from the game' });
    }
  });
};

export default gameSocket;
