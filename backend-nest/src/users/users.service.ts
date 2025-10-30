import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { parsePagination, formatPaginationResponse } from '../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findAll(query: any) {
    const { username, role } = query;
    const { limit, offset } = parsePagination(query);
    
    const where: any = {};
    if (username) {
      where.username = { [Op.like]: `%${username}%` };
    }
    if (role) {
      where.role = role;
    }

    const { count, rows } = await this.userModel.findAndCountAll({
      where,
      attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return formatPaginationResponse(rows, count);
  }

  async create(data: any) {
    const { username, email, password, role } = data;

    const existingUser = await this.userModel.findOne({ where: { username } });
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    const existingEmail = await this.userModel.findOne({ where: { email } });
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  async updateRole(id: number, role: string) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await user.update({ role });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  async resetPassword(id: number, password: string) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('旧密码错误');
    }

    // 更新为新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
  }

  async delete(id: number, currentUserId: number) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (id === currentUserId) {
      throw new ForbiddenException('不能删除自己');
    }

    await user.destroy();
  }
}