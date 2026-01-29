import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/knex.module';

export interface OperationLog {
  id?: number;
  user_id: number;
  username: string;
  action: string;
  module: string;
  method: string;
  path: string;
  params?: string;
  ip?: string;
  user_agent?: string;
  status_code?: number;
  error_message?: string;
  duration?: number;
  created_at?: Date;
}

@Injectable()
export class OperationLogsService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  // 创建操作日志
  async createLog(log: OperationLog): Promise<void> {
    try {
      await this.knex('operation_logs').insert({
        ...log,
        created_at: new Date(),
      });
    } catch (error) {
      console.error('创建操作日志失败:', error);
    }
  }

  // 查询操作日志（带分页和筛选）
  async getLogs(query: {
    page?: number;
    pageSize?: number;
    username?: string;
    action?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let baseQuery = this.knex('operation_logs');

    // 筛选条件
    if (query.username) {
      baseQuery = baseQuery.where('username', 'like', `%${query.username}%`);
    }
    if (query.action) {
      baseQuery = baseQuery.where('action', query.action);
    }
    if (query.module) {
      baseQuery = baseQuery.where('module', query.module);
    }
    if (query.startDate) {
      // created_at 是毫秒时间戳，需要转换
      const startTimestamp = new Date(query.startDate).getTime();
      baseQuery = baseQuery.where('created_at', '>=', startTimestamp);
    }
    if (query.endDate) {
      // created_at 是毫秒时间戳，需要转换
      const endTimestamp = new Date(query.endDate + ' 23:59:59').getTime();
      baseQuery = baseQuery.where('created_at', '<=', endTimestamp);
    }

    // 获取总数
    const [{ count }] = await baseQuery.clone().count('id as count');

    // 获取数据
    const logs = await baseQuery
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    return {
      data: logs,
      total: parseInt(count as string, 10),
      page,
      pageSize,
    };
  }

  // 获取操作类型统计
  async getActionStats() {
    const stats = await this.knex('operation_logs')
      .select('action')
      .count('id as count')
      .groupBy('action')
      .orderBy('count', 'desc');

    return stats.map((row) => ({
      action: row.action,
      count: parseInt(row.count as string, 10),
    }));
  }

  // 获取模块统计
  async getModuleStats() {
    const stats = await this.knex('operation_logs')
      .select('module')
      .count('id as count')
      .groupBy('module')
      .orderBy('count', 'desc');

    return stats.map((row) => ({
      module: row.module,
      count: parseInt(row.count as string, 10),
    }));
  }
}
