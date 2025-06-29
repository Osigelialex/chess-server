import 'reflect-metadata';
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import { createSocketServer } from './sockets';
import { createServer } from 'http';

const app = express();

app.use(cors())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);

app.use(errorHandler);

app.use(notFoundHandler);

const httpServer = createServer(app);

export const io = createSocketServer(httpServer);

export default httpServer;
