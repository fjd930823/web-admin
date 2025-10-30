import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'dev_complete', 'testing', 'deployed', 'archived'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsInt()
  assignee_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class UpdateTaskDto extends CreateTaskDto {}

export class UpdateTaskStatusDto {
  @IsEnum(['todo', 'in_progress', 'dev_complete', 'testing', 'deployed', 'archived'])
  status: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}