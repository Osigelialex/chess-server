import io from "socket.io";
import { BadRequestError } from "../utils/exceptions";
import { verifyToken } from "../utils/helpers";

export const socketAuthMiddleware = (socket: io.Socket, next: (err?: any) => void) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new BadRequestError("Auth token not provided"));
    }

    const { userId } = verifyToken(token);
    if (!userId) {
      return next(new BadRequestError("Invalid auth token"));
    }

    socket.data.userId = userId;

    next();
  } catch (error: any) {
    next(new BadRequestError(error.message || "Authentication failed"));
  }
}
