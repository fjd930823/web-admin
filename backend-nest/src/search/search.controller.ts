import { Controller, Get, Query, UseGuards, Res, Param } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Response } from 'express';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() searchDto: SearchDto) {
    return this.searchService.search(searchDto);
  }

  @Get('detail/:id')
  async getDetail(@Param('id') id: string) {
    return this.searchService.getMovieDetail(id);
  }

  @Public() // 图片代理接口公开访问（img标签请求不带token）
  @Get('proxy-image')
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    return await this.searchService.proxyImage(url, res);
  }
}
