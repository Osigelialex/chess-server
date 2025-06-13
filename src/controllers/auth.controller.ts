import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AuthService from "../service/auth.service";

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
}
