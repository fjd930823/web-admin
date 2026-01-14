import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/knex.module';
import { CreatePostDto } from './dto/create-post.dto';

export interface Post {
  id: number;
  username: string;
  password: string;
  title: string;
  board: string;
  tags?: string;
  content: string;
  status: 'success' | 'failed';
  error_message?: string;
  creator_id?: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PostsService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async create(createPostDto: CreatePostDto, userId?: number): Promise<Post> {
    try {
      const [id] = await this.knex<Post>('posts').insert({
        ...createPostDto,
        creator_id: userId,
        status: 'success',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const post = await this.knex<Post>('posts').where({ id }).first();
      return post!;
    } catch (error) {
      const [id] = await this.knex<Post>('posts').insert({
        ...createPostDto,
        creator_id: userId,
        status: 'failed',
        error_message: error.message,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const post = await this.knex<Post>('posts').where({ id }).first();
      return post!;
    }
  }

  async findAll(query: any): Promise<{ data: any[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      status,
      username,
      title,
      sortField = 'created_at',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let queryBuilder = this.knex<Post>('posts')
      .leftJoin('users', 'posts.creator_id', 'users.id')
      .select(
        'posts.*',
        'users.username as creator_username',
        'users.email as creator_email',
        'users.id as creator_user_id'
      );

    if (status) {
      queryBuilder = queryBuilder.where('posts.status', status);
    }
    if (username) {
      queryBuilder = queryBuilder.where('posts.username', 'like', `%${username}%`);
    }
    if (title) {
      queryBuilder = queryBuilder.where('posts.title', 'like', `%${title}%`);
    }

    // 获取总数
    const countResult = await queryBuilder.clone().clearSelect().count<{ count: number }>('posts.id as count').first();
    const total = Number(countResult?.count || 0);

    // 获取数据
    const rows = await queryBuilder
      .orderBy(`posts.${sortField}`, sortOrder.toLowerCase())
      .limit(limit)
      .offset(offset);

    // 格式化数据，添加创建者信息
    const data = rows.map((row: any) => ({
      ...row,
      creator: row.creator_user_id ? {
        id: row.creator_user_id,
        username: row.creator_username,
        email: row.creator_email,
      } : null,
      // 移除临时字段
      creator_username: undefined,
      creator_email: undefined,
      creator_user_id: undefined,
    }));

    return {
      data,
      total,
    };
  }

  async remove(id: number): Promise<void> {
    await this.knex<Post>('posts').where({ id }).del();
  }
}
