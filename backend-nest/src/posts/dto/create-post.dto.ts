import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  board: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
