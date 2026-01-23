import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokenConfigDto, BatchUpdateTokensDto } from './dto/token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tokens')
@UseGuards(JwtAuthGuard)
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get()
  async getAllTokens() {
    const tokens = await this.tokensService.getAllTokens();
    return {
      success: true,
      data: tokens,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToken(@Body() tokenDto: TokenConfigDto) {
    await this.tokensService.upsertToken(tokenDto);
    return {
      success: true,
      message: 'Token 配置已添加',
    };
  }

  @Put(':phone')
  async updateToken(
    @Param('phone') phone: string,
    @Body() tokenDto: TokenConfigDto,
  ) {
    // 确保 URL 中的 phone 和 body 中的一致
    tokenDto.phone = phone;
    await this.tokensService.upsertToken(tokenDto);
    return {
      success: true,
      message: 'Token 配置已更新',
    };
  }

  @Delete(':phone')
  async deleteToken(@Param('phone') phone: string) {
    await this.tokensService.deleteToken(phone);
    return {
      success: true,
      message: 'Token 配置已删除',
    };
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async batchUpdateTokens(@Body() batchDto: BatchUpdateTokensDto) {
    await this.tokensService.batchUpdateTokens(batchDto.tokens);
    return {
      success: true,
      message: '批量更新成功',
    };
  }
}
