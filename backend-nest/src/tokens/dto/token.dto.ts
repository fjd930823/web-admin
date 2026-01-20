import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class TokenConfigDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  bbs_token: string;

  @IsString()
  @IsOptional()
  expires?: string;
}

export class BatchUpdateTokensDto {
  @IsArray()
  tokens: TokenConfigDto[];
}
