import { Server } from "socket.io";
import registerGameSocket from "./game.socket";
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

  socketServer.use(socketAuthMiddleware);

  socketServer.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    registerGameSocket(socketServer, socket);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  socketServer.on("connection_error", (error) => {
    console.error("Socket connection error:", error.message);
  })

  return socketServer;
}
