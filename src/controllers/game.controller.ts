import GameService from "../service/game.service";
import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces";
import { StatusCodes } from "http-status-codes";

export default class GameController {
  constructor(private readonly gameService: GameService) {}

  public createGame = async (request: AuthenticatedRequest, response: Response) => {
    const userId = request.user?.id;
    const res = await this.gameService.createGame(userId!, request.body);
    response.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Game created successfully',
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
}
