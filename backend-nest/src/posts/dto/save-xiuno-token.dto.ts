import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SaveXiunoTokenDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  cookies?: string;
}
