import dotenv from 'dotenv';

dotenv.config()

interface Config {
  port: number;
  nodeEnv: string;
  saltRounds: number;
  jwtSecret: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 7000,
  nodeEnv: process.env.NODE_ENV || 'development',
  saltRounds: Number(process.env.SALT_ROUNDS)!,
  jwtSecret: process.env.JWT_SECRET || 'secret'
};

export default config;
