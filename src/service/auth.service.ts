import { LoginDto, RefreshTokenDto, SignupDto } from "../dto/auth.dto";
import prisma from "../database";
import { BadRequestError, ServerError, NotFoundError, UnauthorizedError } from "../utils/exceptions";
import _ from "lodash";
import { redisClient } from "../redis";
import { DecodedToken } from "../interfaces";
import { hashPassword, verifyPassword, 
  generateRandomAvatar, generateToken, generateRefresh, verifyToken } from "../utils/helpers";

export default class AuthService {

  public async signup(dto: SignupDto) {
    const { email, username, password } = dto;
    const existingEmail = await prisma.user.findFirst({
      where: { email }
    });

    if (existingEmail) {
      throw new BadRequestError('This email is already in use');
    };

    const existingUsername = await prisma.user.findFirst({
      where: { username }
    });

    if (existingUsername) {
      throw new BadRequestError('This username is already in use');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email,
        username: username,
        password: passwordHash,
        avatar: generateRandomAvatar()
      }
    });

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefresh(user.id);

    return { accessToken, refreshToken }
  }

  public async login(dto: LoginDto) {
    const { emailOrUsername, password } = dto;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });

    if (!user) {
      throw new BadRequestError('Invalid email or password');
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestError('Invalid email or password');
    }

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefresh(user.id);

    return { accessToken, refreshToken }
  }

  public async refreshToken(dto: RefreshTokenDto) {
    const payload = verifyToken(dto.refreshToken);

    const tokenKey = `blacklist:${dto.refreshToken}`;
    const isBlacklisted = await redisClient.get(tokenKey);
    if (isBlacklisted) {
      throw new BadRequestError('Refresh token has been blacklisted');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const newAccessToken = generateToken(user.id);

    return { accessToken: newAccessToken };
  }

  public async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return _.omit(user, ['password', 'id']);
  }

  public async logout(dto: RefreshTokenDto) {
    let payload: DecodedToken;

    try {
      payload = verifyToken(dto.refreshToken);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    try {
      const tokenKey = `blacklist:${dto.refreshToken}`;
      const ttl = Math.max(1, payload.exp - Math.floor(Date.now() / 1000));
      await redisClient.set(tokenKey, 'blacklisted', 'EX', ttl);
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new ServerError('Logout temporarily unavailable, please try again later');
      }
      console.error('Error blacklisting token:', error);
      throw new ServerError('Logout failed due to a server error');
    }
  }
}
