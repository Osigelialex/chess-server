import { Exclude, Expose, Type } from "class-transformer";
import { IsString, IsNotEmpty, IsEnum } from "class-validator";
import { SideToPlay } from "../enums";
import { UserResponseDto } from "./auth.dto";

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  timeControl: string;

  @IsEnum(SideToPlay)
  sideToPlay: SideToPlay;
}

@Exclude()
export class GameCreatedResponseDto {
  @Expose()
  id: string;
  @Expose()
  timeControl: string;
  @Expose()
  boardState: string;
  @Expose()
  status: string;
  @Expose()
  createdAt: Date;
}

@Exclude()
export class RetrieveGameResponseDto {
  @Expose()
  id: string;
  @Expose()
  timeControl: string;
  @Expose()
  boardState: string;
  @Expose()
  result: string;
  @Expose()
  @Type(() => UserResponseDto)
  whitePlayer: UserResponseDto;
  @Expose()
  @Type(() => UserResponseDto)
  blackPlayer: UserResponseDto;
  @Expose()
  createdAt: Date;
}
