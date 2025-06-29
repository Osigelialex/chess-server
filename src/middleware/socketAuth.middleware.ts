import io from "socket.io";
import { BadRequestError } from "../utils/exceptions";
import { verifyToken } from "../utils/helpers";

export const socketAuthMiddleware = (socket: io.Socket, next: (err?: any) => void) => {
  const token = socket.handshake.headers.authorization;

  if (!token) {
    return next(new BadRequestError("Auth token not provided"));
  }

  const { userId } = verifyToken(token);
  if (!userId) {
    return next(new BadRequestError("Invalid auth token"));
  }

  socket.data.userId = userId;

  next();
}
