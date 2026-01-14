import { IsString, IsOptional } from 'class-validator';

export class SearchDto {
  @IsString()
  keyword: string;

  @IsOptional()
  @IsString()
  type?: string;
}
