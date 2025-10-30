import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './dto/create-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(@Query() query) {
    const result = await this.tasksService.findAll(query);
    return {
      success: true,
      data: result.list,
      total: result.total,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.tasksService.findOne(+id);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    const result = await this.tasksService.create(createTaskDto, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    const result = await this.tasksService.update(+id, updateTaskDto, req.user);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateTaskStatusDto) {
    const result = await this.tasksService.updateStatus(+id, updateStatusDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.tasksService.remove(+id, req.user);
    return {
      success: true,
    };
  }
}