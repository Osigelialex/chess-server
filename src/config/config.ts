import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  saltRounds: number;
  jwtSecret: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  redisDb: number;
  redisUrl: string;
  nodeEnv: string;
  frontendUrl: string;
}

const config: Config = {
  port: Number(process.env.APP_PORT) || 7000,
  saltRounds: Number(process.env.SALT_ROUNDS) || 10,
  jwtSecret: process.env.JWT_SECRET || 'secret',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisDb: Number(process.env.REDIS_DB) || 0,
  redisUrl: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};

export default config;
