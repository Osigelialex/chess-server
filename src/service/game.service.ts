import { CreateGameDto, RetrieveGameResponseDto, CreateGuestGameDto } from "../dto/game.dto";
import prisma from "../config/db.config";
import { ServerError, NotFoundError, BadRequestError } from "../utils/exceptions";
import { chessConstants } from "../utils/constants";
import { plainToInstance } from "class-transformer";
import { GameCreatedResponseDto } from "../dto/game.dto";
import { HandleErrors } from "../utils/decorators";
import { redisClient } from "../config/redis.config";
import crypto, { randomUUID } from 'crypto';
import { generateToken } from "../utils/helpers";
import config from "../config/config";

export default class GameService {

  /**
   * Creates a new game with the specified time control and side to play.
   * If sideToPlay is 'random', it randomly assigns the user to either white or black.
   * If sideToPlay is 'white' or 'black', it assigns the user to that side.
   * 
   * @param userId - The ID of the user creating the game.
   * @param dto - The data transfer object containing game creation details.
   * @returns A promise that resolves to the created game response DTO.
   */
  @HandleErrors()
  public async createGame(userId: string, dto: CreateGameDto) {
    const { timeControl, sideToPlay } = dto;

    const boardState = chessConstants.INITIAL_FEN_POSITION;
    const gameData = {
      timeControl: timeControl,
      boardState: boardState
    }

    if (sideToPlay === 'random') {
      const randomSide = Math.random() < 0.5 ? 'white' : 'black';
      if (randomSide === 'white') {
        gameData['whitePlayer'] = { connect: { id: userId } };
      } else {
        gameData['blackPlayer'] = { connect: { id: userId } };
      }
    } else if (sideToPlay === 'white') {
      gameData['whitePlayer'] = { connect: { id: userId } };
    } else {
      gameData['blackPlayer'] = { connect: { id: userId } };
    }

    try {
      const game = await prisma.game.create({ data: gameData });
      return plainToInstance(GameCreatedResponseDto, game);
    } catch (error) {
      throw new ServerError("Could not create game at this time. Please try again later.");
    }
  }

  @HandleErrors()
  public async createGuestGame(dto: CreateGuestGameDto) {
    const { sideToPlay } = dto;
    const boardState = chessConstants.INITIAL_FEN_POSITION;
    const gameData = {
      boardState: boardState,
      code: crypto.randomBytes(7).toString('hex')
    }

    const uniquePlayerId = randomUUID()
    if (sideToPlay === 'random') {
      const randomSide = Math.random() < 0.5 ? 'white' : 'black';
      if (randomSide === 'white') {
        gameData['whitePlayerId'] = uniquePlayerId;
      } else {
        gameData['blackPlayerId'] = uniquePlayerId;
      }
    } else if (sideToPlay === 'white') {
      gameData['whitePlayerId'] = uniquePlayerId;
    } else {
      gameData['blackPlayerId'] = uniquePlayerId;
    }

    try {
      const game = await prisma.guestGame.create({ data: gameData });
      return { id: game.id, code: game.code, jwt: generateToken(uniquePlayerId) }
    } catch (error) {
      throw new ServerError("Could not create game at this time. Please try again later.");
    }
  }

  @HandleErrors()
  public async joinGuestGame(code: string) {
    const game = await prisma.guestGame.findUnique({ where: { code } });

    if (!game) {
      throw new NotFoundError("Game not found.");
    }

    const uniquePlayerId = randomUUID();
    if (game.whitePlayerId === null) {
      game.whitePlayerId = uniquePlayerId
    } else if (game.blackPlayerId === null) {
      game.blackPlayerId = uniquePlayerId;
    } else {
      throw new BadRequestError("Game is already full.");
    }

    redisClient.set(`game:${game.id}`, JSON.stringify(game), 'EX', 1800);

    try {
      await prisma.guestGame.update({
        where: { id: game.id },
        data: {
          whitePlayerId: game.whitePlayerId,
          blackPlayerId: game.blackPlayerId
        }
      });
    } catch (error) {
      console.log(error);
      throw new ServerError("Could not join game at this time. Please try again later.");
    };

    return { id: game.id, jwt: generateToken(uniquePlayerId) }
  }

  /**
   * Joins an existing game as either the white or black player.
   * If the game is already full, it throws an error.
   * If the user is already in the game, it throws an error.
   * 
   * @param userId - The ID of the user joining the game.
   * @param gameId - The ID of the game to join.
   */
  @HandleErrors()
  public async joinGame(userId: string, gameId: string) {
    const [game, user] = await Promise.all([
      prisma.game.findUnique({ where: { id: gameId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);

    if (!game) {
      throw new NotFoundError("Game not found.");
    }

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (userId === game.whitePlayerId || userId === game.blackPlayerId) {
      throw new BadRequestError("You are already in this game.");
    }

    if (game.whitePlayerId === null) {
      game.whitePlayerId = user.id;
    } else if (game.blackPlayerId === null) {
      game.blackPlayerId = user.id;
    } else {
      throw new BadRequestError("Game is already full.");
    }

    redisClient.set(`game:${game.id}`, JSON.stringify(game), 'EX', 1800);

    await prisma.game.update({
      where: { id: gameId },
      data: {
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId
      }
    });
  }

  /**
   * Retrieves a game by its ID, including the players involved.
   * 
   * @param gameId - The ID of the game to retrieve.
   * @returns A promise that resolves to the game object.
   */
  @HandleErrors()
  public async getGameById(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true
      }
    });

    if (!game) {
      throw new NotFoundError("Game not found.");
    }

    return plainToInstance(RetrieveGameResponseDto, game);
  }

  @HandleErrors()
  public async getGuestGameByCode(playerId: string, code: string) {
    const game = await prisma.guestGame.findUnique({
      where: { code }
    });

    if (!game) {
      throw new NotFoundError("Game not found");
    }

    let sideToPlay;
    if (game.whitePlayerId === playerId) {
      sideToPlay = 'white';
    } else if (game.blackPlayerId === playerId) {
      sideToPlay = 'black';
    } else {
      throw new BadRequestError("You are not a player in this game");
    }

    return {
      id: game.id,
      sideToPlay,
      link: `${config.frontendUrl}/${code}`
    }    
  }

  @HandleErrors()
  public async getGameHistory(userId: string, limit: number, offset: number) {
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { whitePlayerId: userId },
          { blackPlayerId: userId }
        ]
      },
      take: limit,
      skip: offset
    });

    const gameDTOs = games.map(
      game => plainToInstance(RetrieveGameResponseDto, game));

    return {
      games: gameDTOs,
      totalCount: gameDTOs.length
    }
  }
}
