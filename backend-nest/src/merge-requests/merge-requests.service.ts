import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/knex.module';
import { CreateMergeRequestDto, UpdateMergeRequestDto } from './dto/create-merge-request.dto';
import { parsePagination, formatPaginationResponse } from '../common/utils/pagination.util';

export interface MergeRequest {
  id: number;
  title: string;
  description?: string;
  source_branch: string;
  target_branch: string;
  repository_url?: string;
  merge_url: string;
  status: string;
  creator_id: number;
  assignee_id?: number;
  merged_by?: number;
  merged_at?: Date;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class MergeRequestsService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async findAll(query: any) {
    const { status } = query;
    const { limit, offset } = parsePagination(query);
    
    let queryBuilder = this.knex<MergeRequest>('merge_requests')
      .leftJoin('users as creator', 'merge_requests.creator_id', 'creator.id')
      .leftJoin('users as assignee', 'merge_requests.assignee_id', 'assignee.id')
      .leftJoin('users as merger', 'merge_requests.merged_by', 'merger.id')
      .select(
        'merge_requests.*',
        'creator.id as creator_id_ref',
        'creator.username as creator_username',
        'creator.email as creator_email',
        'assignee.id as assignee_id_ref',
        'assignee.username as assignee_username',
        'assignee.email as assignee_email',
        'merger.id as merger_id_ref',
        'merger.username as merger_username',
        'merger.email as merger_email'
      );

    if (status) {
      queryBuilder = queryBuilder.where('merge_requests.status', status);
    }

    // 获取总数
    const countResult = await queryBuilder.clone().clearSelect().clearOrder().count('merge_requests.id as count').first();
    const count = Number(countResult?.count || 0);

    // 获取数据
    const rows = await queryBuilder
      .orderBy('merge_requests.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const list = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      source_branch: row.source_branch,
      target_branch: row.target_branch,
      repository_url: row.repository_url,
      merge_url: row.merge_url,
      status: row.status,
      creator_id: row.creator_id,
      assignee_id: row.assignee_id,
      merged_by: row.merged_by,
      merged_at: row.merged_at,
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
      merger: row.merger_id_ref ? {
        id: row.merger_id_ref,
        username: row.merger_username,
        email: row.merger_email,
      } : null,
      creator_name: row.creator_username,
      assignee_name: row.assignee_username,
      merger_name: row.merger_username,
    }));

    return formatPaginationResponse(list, count);
  }

  async findOne(id: number) {
    try {
      const row: any = await this.knex<MergeRequest>('merge_requests')
        .leftJoin('users as creator', 'merge_requests.creator_id', 'creator.id')
        .leftJoin('users as assignee', 'merge_requests.assignee_id', 'assignee.id')
        .leftJoin('users as merger', 'merge_requests.merged_by', 'merger.id')
        .where('merge_requests.id', id)
        .select(
          'merge_requests.*',
          'creator.id as creator_id_ref',
          'creator.username as creator_username',
          'creator.email as creator_email',
          'assignee.id as assignee_id_ref',
          'assignee.username as assignee_username',
          'assignee.email as assignee_email',
          'merger.id as merger_id_ref',
          'merger.username as merger_username',
          'merger.email as merger_email'
        )
        .first();

      if (!row) {
        throw new NotFoundException('合并请求不存在');
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        source_branch: row.source_branch,
        target_branch: row.target_branch,
        repository_url: row.repository_url,
        merge_url: row.merge_url,
        status: row.status,
        creator_id: row.creator_id,
        assignee_id: row.assignee_id,
        merged_by: row.merged_by,
        merged_at: row.merged_at,
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
        merger: row.merger_id_ref ? {
          id: row.merger_id_ref,
          username: row.merger_username,
          email: row.merger_email,
        } : null,
        creator_name: row.creator_username,
        assignee_name: row.assignee_username,
        merger_name: row.merger_username,
      };
    } catch (error) {
      // 如果是已知的 NotFoundException，直接抛出
      if (error instanceof NotFoundException) {
        throw error;
      }
      // 记录未预期的错误
      console.error('Error in findOne merge request:', error);
      throw new Error(`查询合并请求失败: ${error.message}`);
    }
  }

  async create(createDto: CreateMergeRequestDto, creatorId: number) {
    const data: any = {
      ...createDto,
      creator_id: creatorId,
      title: createDto.merge_url,
      source_branch: '-',
      target_branch: '-',
      created_at: new Date(),
      updated_at: new Date(),
    };

    if (!data.repository_url) {
      data.repository_url = null;
    }

    const [id] = await this.knex<MergeRequest>('merge_requests').insert(data);
    return this.findOne(id);
  }

  async update(id: number, updateDto: UpdateMergeRequestDto, user: any) {
    try {
      const mergeRequest = await this.knex<MergeRequest>('merge_requests').where({ id }).first();
      if (!mergeRequest) {
        throw new NotFoundException('合并请求不存在');
      }

      if (mergeRequest.creator_id !== user.id && user.role !== 'admin') {
        throw new ForbiddenException('没有权限修改此合并请求');
      }

      const updateData: any = { 
        ...updateDto,
        updated_at: new Date(),
      };

      // 如果状态改为已合并，记录合并人和合并时间
      if (updateDto.status === 'merged' && mergeRequest.status !== 'merged') {
        updateData.merged_by = user.id;
        updateData.merged_at = new Date();
      }

      await this.knex<MergeRequest>('merge_requests')
        .where({ id })
        .update(updateData);

      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error in update merge request:', error);
      throw new Error(`更新合并请求失败: ${error.message}`);
    }
  }

  async remove(id: number, user: any) {
    const mergeRequest = await this.knex<MergeRequest>('merge_requests').where({ id }).first();
    if (!mergeRequest) {
      throw new NotFoundException('合并请求不存在');
    }

    // 检查用户是否已登录
    if (!user || !user.id) {
      throw new ForbiddenException('用户未登录或认证已过期，请重新登录');
    }

    if (mergeRequest.creator_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('没有权限删除此合并请求');
    }

    await this.knex<MergeRequest>('merge_requests').where({ id }).del();
  }
}
