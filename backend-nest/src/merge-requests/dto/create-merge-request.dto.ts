import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUrl } from 'class-validator';

export class CreateMergeRequestDto {
  @IsUrl()
  @IsNotEmpty()
  merge_url: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  repository_url?: string;

  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'merged'])
  status?: string;
}

export class UpdateMergeRequestDto extends CreateMergeRequestDto {}