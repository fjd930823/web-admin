import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/knex.module';

@Injectable()
export class StatisticsService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  // 获取已归档任务的用户占比
  async getArchivedTasksByUser() {
    const results = await this.knex('tasks')
      .select('users.username')
      .count('tasks.id as count')
      .leftJoin('users', 'tasks.assignee_id', 'users.id')
      .where('tasks.status', 'archived')
      .groupBy('tasks.assignee_id', 'users.username')
      .orderBy('count', 'desc');

    return results.map(row => ({
      name: row.username || '未分配',
      value: parseInt(row.count as string, 10),
    }));
  }

  // 获取用户任务数量统计（支持状态和月份筛选）
  async getTasksByUser(status?: string, year?: number, month?: number) {
    let query = this.knex('tasks')
      .select('users.username')
      .count('tasks.id as count')
      .leftJoin('users', 'tasks.assignee_id', 'users.id')
      .groupBy('tasks.assignee_id', 'users.username')
      .orderBy('count', 'desc');

    if (status) {
      query = query.where('tasks.status', status);
    }

    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query = query
        .whereBetween('tasks.created_at', [
          startDate.toISOString(),
          endDate.toISOString(),
        ]);
    }

    const results = await query;

    return results.map(row => ({
      name: row.username || '未分配',
      value: parseInt(row.count as string, 10),
    }));
  }

  // 获取系统登录用户发帖数量统计（按周分组，支持时间范围筛选）
  async getPostsByUser(startDate?: string, endDate?: string) {
    let query = this.knex('posts')
      .select(
        this.knex.raw(`
          strftime('%Y-%W', datetime(posts.created_at / 1000, 'unixepoch')) as week,
          users.username,
          COUNT(*) as count
        `),
      )
      .leftJoin('users', 'posts.creator_id', 'users.id')
      .groupBy('week', 'users.username')
      .orderBy('week', 'asc');

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      query = query.where('posts.created_at', '>=', startTimestamp);
    }

    if (endDate) {
      const endTimestamp = new Date(endDate + ' 23:59:59').getTime();
      query = query.where('posts.created_at', '<=', endTimestamp);
    }

    const results = await query;

    // 转换数据结构：{ weeks: [], series: [{ name: username, data: [] }] }
    const weekMap = new Map<string, Map<string, number>>();
    const usersSet = new Set<string>();

    results.forEach((row: any) => {
      const week = row.week || 'Unknown';
      const username = row.username || '未知用户';
      const count = parseInt(row.count as string, 10);

      if (!weekMap.has(week)) {
        weekMap.set(week, new Map());
      }
      weekMap.get(week)!.set(username, count);
      usersSet.add(username);
    });

    const weeks = Array.from(weekMap.keys()).sort();
    const users = Array.from(usersSet);

    const series = users.map((username) => ({
      name: username,
      data: weeks.map((week) => weekMap.get(week)?.get(username) || 0),
    }));

    return {
      weeks,
      series,
    };
  }

  // 获取总体统计数据
  async getOverallStatistics() {
    const [
      totalTasks,
      totalArchivedTasks,
      totalPosts,
      totalUsers,
    ] = await Promise.all([
      this.knex('tasks').count('id as count').first(),
      this.knex('tasks').where('status', 'archived').count('id as count').first(),
      this.knex('posts').count('id as count').first(),
      this.knex('users').count('id as count').first(),
    ]);

    return {
      totalTasks: parseInt(totalTasks?.count as string || '0', 10),
      totalArchivedTasks: parseInt(totalArchivedTasks?.count as string || '0', 10),
      totalPosts: parseInt(totalPosts?.count as string || '0', 10),
      totalUsers: parseInt(totalUsers?.count as string || '0', 10),
    };
  }
}
