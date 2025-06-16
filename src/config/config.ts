import dotenv from 'dotenv';

dotenv.config()

interface Config {
  port: number;
  nodeEnv: string;
  saltRounds: number;
  jwtSecret: string;
  redisHost: string;
  redisPort: number;
  redisPassword: string | undefined;
  redisDb: number;
  redisUrl: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 7000,
  nodeEnv: process.env.NODE_ENV || 'development',
  saltRounds: Number(process.env.SALT_ROUNDS)!,
  jwtSecret: process.env.JWT_SECRET || 'secret',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisDb: Number(process.env.REDIS_DB) || 0,
  redisUrl: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
};

export default config;
