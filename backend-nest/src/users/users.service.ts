import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';
import { KNEX_CONNECTION } from '../database/knex.module';
import { parsePagination, formatPaginationResponse } from '../common/utils/pagination.util';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async findAll(query: any) {
    const { username, role } = query;
    const { limit, offset } = parsePagination(query);
    
    let queryBuilder = this.knex<User>('users');

    if (username) {
      queryBuilder = queryBuilder.where('username', 'like', `%${username}%`);
    }
    if (role) {
      queryBuilder = queryBuilder.where('role', role);
    }

    // 获取总数
    const countResult = await queryBuilder.clone().count<{ count: number }>('* as count').first();
    const count = Number(countResult?.count || 0);

    // 获取数据
    const rows = await queryBuilder
      .select('id', 'username', 'email', 'role', 'created_at as createdAt', 'updated_at as updatedAt')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return formatPaginationResponse(rows, count);
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.knex<User>('users')
      .where({ username })
      .first();
    return user || null;
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.knex<User>('users')
      .where({ id })
      .first();
    return user || null;
  }

  async create(data: any) {
    const { username, email, password, role } = data;

    // 检查用户名是否存在
    const existingUser = await this.knex<User>('users')
      .where({ username })
      .first();
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否存在
    const existingEmail = await this.knex<User>('users')
      .where({ email })
      .first();
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [id] = await this.knex<User>('users').insert({
      username,
      email,
      password: hashedPassword,
      role,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // SQLite 返回的是最后插入的 ID
    const user = await this.knex<User>('users').where({ id }).first();

    return {
      id: user!.id,
      username: user!.username,
      email: user!.email,
      role: user!.role,
    };
  }

  async updateRole(id: number, role: string) {
    const user = await this.knex<User>('users').where({ id }).first();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.knex('users')
      .where({ id })
      .update({
        role: role as 'admin' | 'user',
        updated_at: new Date(),
      });

    const updatedUser = await this.knex<User>('users').where({ id }).first();

    return {
      id: updatedUser!.id,
      username: updatedUser!.username,
      email: updatedUser!.email,
      role: updatedUser!.role,
    };
  }

  async resetPassword(id: number, password: string) {
    const user = await this.knex<User>('users').where({ id }).first();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.knex<User>('users')
      .where({ id })
      .update({
        password: hashedPassword,
        updated_at: new Date(),
      });
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.knex<User>('users').where({ id: userId }).first();
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
    await this.knex<User>('users')
      .where({ id: userId })
      .update({
        password: hashedPassword,
        updated_at: new Date(),
      });
  }

  async delete(id: number, currentUserId: number) {
    const user = await this.knex<User>('users').where({ id }).first();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (id === currentUserId) {
      throw new ForbiddenException('不能删除自己');
    }

    await this.knex<User>('users').where({ id }).del();
  }
}
