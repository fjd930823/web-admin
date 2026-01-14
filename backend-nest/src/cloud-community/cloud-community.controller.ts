import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CloudCommunityService, CreateCloudAccountDto, CreateCloudPostDto } from './cloud-community.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('cloud-community')
@UseGuards(JwtAuthGuard)
export class CloudCommunityController {
  constructor(private readonly cloudCommunityService: CloudCommunityService) {}

  /**
   * 创建云盘账号
   */
  @Post('accounts')
  async createAccount(@Body() createAccountDto: CreateCloudAccountDto) {
    const result = await this.cloudCommunityService.createAccount(createAccountDto);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 获取所有云盘账号
   */
  @Get('accounts')
  async getAllAccounts() {
    const result = await this.cloudCommunityService.getAllAccounts();
    return {
      success: true,
      data: result,
    };
  }

  /**
   * 登录到云盘社区
   */
  @Post('login/:accountId')
  async loginToCommunity(@Param('accountId') accountId: string) {
    const result = await this.cloudCommunityService.loginToCommunity(Number(accountId));
    return {
      success: result.success,
      data: result,
    };
  }

  /**
   * 发布帖子到云盘社区
   */
  @Post('posts')
  async createPostInCommunity(@Body() createPostDto: CreateCloudPostDto) {
    const result = await this.cloudCommunityService.createPostInCommunity(createPostDto);
    return {
      success: result.success,
      data: result,
    };
  }

  /**
   * 删除云盘社区的帖子
   */
  @Delete('posts/:postId/account/:accountId')
  async deletePostFromCommunity(
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
  ) {
    const result = await this.cloudCommunityService.deletePostFromCommunity(Number(accountId), postId);
    return {
      success: result.success,
      data: result,
    };
  }

  /**
   * 获取所有帖子记录
   */
  @Get('posts')
  async getAllPosts() {
    const result = await this.cloudCommunityService.getAllPosts();
    return {
      success: true,
      data: result,
      total: result.length,
    };
  }

  /**
   * 根据账号获取帖子记录
   */
  @Get('posts/account/:accountId')
  async getPostsByAccount(@Param('accountId') accountId: string) {
    const result = await this.cloudCommunityService.getPostsByAccount(Number(accountId));
    return {
      success: true,
      data: result,
      total: result.length,
    };
  }
}