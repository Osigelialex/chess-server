import { Server} from "socket.io";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware";
import app from "../app";

export const createSocketServer = (server: any) => {
  const socketServer = new Server(server, {
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

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return socketServer;
}

export const socket = createSocketServer(app);
