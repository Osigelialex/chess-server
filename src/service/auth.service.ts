import { LoginDto, SignupDto } from "../dto/auth.dto";
import prisma from "../database/index.database";
import { CustomError } from "../utils/error.utils";
import { hashPassword, verifyPassword } from "../utils/password.utils";
import { generateToken, generateRefresh } from "../utils/token.utils";
import { generateRandomAvatar } from "../utils/avatar.utils";

export default class AuthService {

  public async signup(dto: SignupDto) {
    const { email, username, password } = dto;
    const existingEmail = await prisma.user.findFirst({
      where: { email }
    });

    if (existingEmail) {
      throw new CustomError(400, 'This email is already in use');
    };

    const existingUsername = await prisma.user.findFirst({
      where: { username }
    });

    if (existingUsername) {
      throw new CustomError(400, 'This username is already in use');
    }

    const passwordHash = await hashPassword(password);

    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: email,
          username: username,
          password: passwordHash
        }
      }),
      prisma.profile.create({
        data: {
          avatar: generateRandomAvatar(),
          user: {
            connect: { email }
          }
        }
      })
    ]);

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
      throw new CustomError(400, 'Invalid email or password');
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new CustomError(400, 'Invalid email or password');
    }

    const accessToken = generateToken(user.id);
    const refreshToken = generateRefresh(user.id);

    return { accessToken, refreshToken }
  }
}
