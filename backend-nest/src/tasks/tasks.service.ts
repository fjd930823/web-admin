import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/knex.module';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './dto/create-task.dto';
import { parsePagination, formatPaginationResponse } from '../common/utils/pagination.util';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee_id?: number;
  creator_id: number;
  start_date?: Date;
  due_date?: Date;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class TasksService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async findAll(query: any) {
    const { status, assignee_id, year, month } = query;
    const { limit, offset } = parsePagination(query, 1000);
    
    let queryBuilder = this.knex<Task>('tasks')
      .leftJoin('users as creator', 'tasks.creator_id', 'creator.id')
      .leftJoin('users as assignee', 'tasks.assignee_id', 'assignee.id')
      .select(
        'tasks.*',
        'creator.id as creator_id_ref',
        'creator.username as creator_username',
        'creator.email as creator_email',
        'assignee.id as assignee_id_ref',
        'assignee.username as assignee_username',
        'assignee.email as assignee_email'
      );

    if (status) {
      queryBuilder = queryBuilder.where('tasks.status', status);
    }
    if (assignee_id !== undefined) {
      if (assignee_id === 0 || assignee_id === '0') {
        queryBuilder = queryBuilder.whereNull('tasks.assignee_id');
      } else {
        queryBuilder = queryBuilder.where('tasks.assignee_id', assignee_id);
      }
    }
    if (year && month) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      queryBuilder = queryBuilder.whereBetween('tasks.start_date', [startOfMonth, endOfMonth]);
    } else if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      queryBuilder = queryBuilder.whereBetween('tasks.start_date', [startOfYear, endOfYear]);
    }

    // 获取总数
    const countResult = await queryBuilder.clone().clearSelect().clearOrder().count('tasks.id as count').first();
    const count = Number(countResult?.count || 0);

    // 获取数据
    const rows = await queryBuilder
      .orderBy('tasks.sort_order', 'asc')
      .orderBy('tasks.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const list = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignee_id: row.assignee_id,
      creator_id: row.creator_id,
      start_date: row.start_date,
      due_date: row.due_date,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator: row.creator_id_ref ? {
        id: row.creator_id_ref,
        username: row.creator_username,
        email: row.creator_email,
      } : null,
      assignee: row.assignee_id_ref ? {
        id: row.assignee_id_ref,
        username: row.assignee_username,
        email: row.assignee_email,
      } : null,
      creator_name: row.creator_username,
      assignee_name: row.assignee_username,
    }));

    return { list, total: count };
  }

  async findOne(id: number) {
    const row: any = await this.knex<Task>('tasks')
      .leftJoin('users as creator', 'tasks.creator_id', 'creator.id')
      .leftJoin('users as assignee', 'tasks.assignee_id', 'assignee.id')
      .where('tasks.id', id)
      .select(
        'tasks.*',
        'creator.id as creator_id_ref',
        'creator.username as creator_username',
        'creator.email as creator_email',
        'assignee.id as assignee_id_ref',
        'assignee.username as assignee_username',
        'assignee.email as assignee_email'
      )
      .first();

    if (!row) {
      throw new NotFoundException('任务不存在');
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignee_id: row.assignee_id,
      creator_id: row.creator_id,
      start_date: row.start_date,
      due_date: row.due_date,
      sort_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator: row.creator_id_ref ? {
        id: row.creator_id_ref,
        username: row.creator_username,
        email: row.creator_email,
      } : null,
      assignee: row.assignee_id_ref ? {
        id: row.assignee_id_ref,
        username: row.assignee_username,
        email: row.assignee_email,
      } : null,
      creator_name: row.creator_username,
      assignee_name: row.assignee_username,
    };
  }

  async create(createTaskDto: CreateTaskDto, creatorId: number) {
    const [id] = await this.knex('tasks').insert({
      ...createTaskDto,
      creator_id: creatorId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.findOne(Number(id));
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: any) {
    const task = await this.knex<Task>('tasks').where({ id }).first();
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.creator_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('没有权限修改此任务');
    }

    await this.knex('tasks')
      .where({ id })
      .update({
        ...updateTaskDto,
        updated_at: new Date(),
      });

    return this.findOne(id);
  }

  async updateStatus(id: number, updateStatusDto: UpdateTaskStatusDto) {
    const task = await this.knex<Task>('tasks').where({ id }).first();
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await this.knex<Task>('tasks')
      .where({ id })
      .update({
        ...updateStatusDto,
        updated_at: new Date(),
      });

    return this.findOne(id);
  }

  async remove(id: number, user: any) {
    const task = await this.knex<Task>('tasks').where({ id }).first();
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.creator_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('没有权限删除此任务');
    }

    await this.knex<Task>('tasks').where({ id }).del();
  }
}
