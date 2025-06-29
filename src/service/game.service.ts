import { CreateGameDto, RetrieveGameResponseDto } from "../dto/game.dto";
import prisma from "../database";
import { ServerError, NotFoundError, BadRequestError } from "../utils/exceptions";
import { chessConstants } from "../utils/constants";
import { plainToInstance } from "class-transformer";
import { GameCreatedResponseDto } from "../dto/game.dto";
import { HandleErrors } from "../utils/decorators";

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
}
