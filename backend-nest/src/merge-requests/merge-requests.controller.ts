import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { MergeRequestsService } from './merge-requests.service';
import { CreateMergeRequestDto, UpdateMergeRequestDto } from './dto/create-merge-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('merge-requests')
@UseGuards(JwtAuthGuard)
export class MergeRequestsController {
  constructor(private readonly mergeRequestsService: MergeRequestsService) {}

  @Get()
  async findAll(@Query() query) {
    const result = await this.mergeRequestsService.findAll(query);
    return {
      success: true,
      data: result.list,
      total: result.total,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.mergeRequestsService.findOne(+id);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  async create(@Body() createDto: CreateMergeRequestDto, @Request() req) {
    const result = await this.mergeRequestsService.create(createDto, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateMergeRequestDto, @Request() req) {
    const result = await this.mergeRequestsService.update(+id, updateDto, req.user);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.mergeRequestsService.remove(+id, req.user);
    return {
      success: true,
    };
  }
}