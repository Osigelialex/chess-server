import bcrypt from 'bcrypt';
import config from '../config/config';

interface HashPassword {
  (password: string): Promise<string>;
}

export const hashPassword: HashPassword = async (password) => {
  const hash = await bcrypt.hash(password, config.saltRounds);
  return hash;
}

export const verifyPassword = async (password: string, hash: string) => {
  const result = await bcrypt.compare(password, hash);
  return result;
}
