import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AuthService from "../service/auth.service";
import { AuthenticatedRequest } from "../interfaces";

export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  public signup = async (request: Request, response: Response) => {
    const res = await this.authService.signup(request.body);
    response.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Signed up sucessfully',
      data: res
    })
  }

  public login = async (request: Request, response: Response) => {
    const res = await this.authService.login(request.body);
    response.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Logged in successfully',
      data: res
    })
  }

  public refresh = async (request: Request, response: Response) => {
    const res = await this.authService.refreshToken(request.body);
    response.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: res
    })
  }

  public fetchProfile = async (request: AuthenticatedRequest, response: Response) => {
    const userId = request.user?.id;
    response.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Profile fetched successfully',
      data: await this.authService.getUserProfile(userId!)
    });
  }

  public logout = async (request: Request, response: Response) => {
    await this.authService.logout(request.body);
    response.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  }
}
