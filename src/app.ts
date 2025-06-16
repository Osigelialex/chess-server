import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes);

app.use(errorHandler);

app.use(notFoundHandler);

export default app;
