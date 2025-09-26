import GameService from "../service/game.service";
import { Response } from "express";
import { AuthenticatedRequest, GuestAuthRequest } from "../interfaces";
import { StatusCodes } from "http-status-codes";
import { paginate } from "../utils/pagination";
import { Request } from "express";

export default class GameController {
  constructor(private readonly gameService: GameService) { }

  public createGame = async (request: AuthenticatedRequest, response: Response) => {
    const userId = request.user?.id;
    const res = await this.gameService.createGame(userId!, request.body);
    response.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Game created successfully',
      data: res
    });
  }

  public createGuestGame = async (request: AuthenticatedRequest, response: Response) => {
    const userId = request.user?.id;
    const res = await this.gameService.createGuestGame(request.body);
    response.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Game created successfully',
      data: res
    });
  }

  public joinGuestGame = async (request: Request, response: Response) => {
    const code = request.params.code;
    const res = await this.gameService.joinGuestGame(code);
    response.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Joined game successfully',
      data: res
    });
  }

  public getGuestGameByCode = async (request: GuestAuthRequest, response: Response) => {
    const code = request.params.code;
    const playerId = request.playerId;
    const res = await this.gameService.getGuestGameByCode(playerId!, code);
    response.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Game Fetched successfully',
      data: res
    });
  }

  public joinGame = async (request: AuthenticatedRequest, response: Response) => {
    const userId = request.user?.id;
    const gameId = request.params.gameId;
    await this.gameService.joinGame(userId!, gameId);
    response.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Joined game successfully'
    });
  }

  public getGameById = async (request: AuthenticatedRequest, response: Response) => {
    const gameId = request.params.gameId;
    const game = await this.gameService.getGameById(gameId);
    response.status(StatusCodes.OK).json({
      status: 'success',
      data: game
    });
  }

  public gameHistory = async (request: AuthenticatedRequest, response: Response) => {
    const limit = Math.min(Number(request.query.limit) || 10, 100);
    const offset = Math.max(Number(request.query.offset) || 0, 0);
    const userId = request.user?.id;

    const gameHistory = await this.gameService.getGameHistory(userId!, limit, offset);
    return paginate(request, response, limit, offset, gameHistory.games);
  }
}
