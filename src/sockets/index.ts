import { Server } from "socket.io";
import registerGameSocket from "./game.socket";
import registerGuestSocket from "./guest.socket";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware";

export const createSocketServer = (server: any) => {
  const socketServer = new Server(server, {
    connectionStateRecovery: {},
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });

  const authNamespace = socketServer.of('/auth');
  const guestNamespace = socketServer.of('/guest');

  authNamespace.use(socketAuthMiddleware);
  authNamespace.on("connection", (socket) => {
    console.log(`[AUTH] New client connected: ${socket.id}`);

    registerGameSocket(authNamespace, socket);

    socket.on("disconnect", () => {
      console.log(`[AUTH] Client disconnected: ${socket.id}`);
    });
  });

  guestNamespace.on("connection", (socket) => {
    console.log(`[GUEST] New client connected: ${socket.id}`);

    registerGuestSocket(guestNamespace, socket);

    socket.on("disconnect", () => {
      console.log(`[GUEST] Client disconnected: ${socket.id}`);
    });
  });

  socketServer.on("connection_error", (error) => {
    console.error("Socket connection error:", error.message);
  })

  return socketServer;
}
