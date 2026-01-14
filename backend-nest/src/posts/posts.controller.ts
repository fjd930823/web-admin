import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Body() createPostDto: CreatePostDto, @Request() req) {
    const post = await this.postsService.create(createPostDto, req.user?.id);
    return {
      success: post.status === 'success',
      data: post,
      message: post.status === 'failed' ? post.error_message : '发帖成功',
    };
  }

  @Get()
  async findAll(@Query() query: any) {
    const result = await this.postsService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.postsService.remove(+id);
    return {
      success: true,
      message: '删除成功',
    };
  }
}
