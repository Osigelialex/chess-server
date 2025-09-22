import { Socket, Namespace } from "socket.io";
import { handlePlayerReady, handleMove, drawOffer, acceptDraw, rejectDraw, resignGuest } from "./game.handlers";

const guestSocket = (io: Namespace, socket: Socket) => {
  socket.on('playerReady', async (data: { gameId: string }) => {
    handlePlayerReady(io, socket, data);
  });

  socket.on('move', async (data: { gameId: string, move: string }) => {
    handleMove(io, socket, data);
  });

  socket.on('resign', async (data: { gameId: string }) => {
    resignGuest(io, socket, data);
  });

  socket.on('drawOffer', async (data: { gameId: string }) => {
    drawOffer(io, socket, data);
  });

  socket.on('acceptDraw', async (data: { gameId: string }) => {
    acceptDraw(io, socket, data);
  });

  socket.on('rejectDraw', async (data: { gameId: string }) => {
    rejectDraw(io, socket, data);
  });
}

export default guestSocket;