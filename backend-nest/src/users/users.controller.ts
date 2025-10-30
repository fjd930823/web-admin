import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  async findAll(@Query() query) {
    const result = await this.usersService.findAll(query);
    return {
      success: true,
      data: result.list,
      total: result.total,
    };
  }

  @Post()
  async create(@Body() createDto: any, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('没有权限创建用户');
    }

    const result = await this.usersService.create(createDto);
    return {
      success: true,
      data: result,
    };
  }

  @Put('change-password')
  async changePassword(@Body() body: any, @Request() req) {
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      throw new Error('请提供旧密码和新密码');
    }

    if (newPassword.length < 6) {
      throw new Error('新密码至少6个字符');
    }

    await this.usersService.changePassword(req.user.id, oldPassword, newPassword);
    return {
      success: true,
      message: '密码修改成功',
    };
  }

  @Put(':id/role')
  async updateRole(@Param('id') id: string, @Body() body: any, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('没有权限修改用户角色');
    }

    const result = await this.usersService.updateRole(+id, body.role);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id/password')
  async resetPassword(@Param('id') id: string, @Body() body: any, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('没有权限重置密码');
    }

    await this.usersService.resetPassword(+id, body.password);
    return {
      success: true,
      message: '密码重置成功',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('没有权限删除用户');
    }

    await this.usersService.delete(+id, req.user.id);
    return {
      success: true,
    };
  }
}