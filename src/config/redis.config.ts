import Redis from 'ioredis';
import config from '../config/config';

export const redisClient = new Redis({
  port: config.redisPort,
  host: config.redisHost,
  password: config.redisPassword,
  db: config.redisDb,
});
