import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MergeRequest } from './entities/merge-request.entity';
import { User } from '../users/entities/user.entity';
import { CreateMergeRequestDto, UpdateMergeRequestDto } from './dto/create-merge-request.dto';
import { parsePagination, formatPaginationResponse } from '../common/utils/pagination.util';

@Injectable()
export class MergeRequestsService {
  constructor(
    @InjectModel(MergeRequest)
    private mergeRequestModel: typeof MergeRequest,
  ) {}

  async findAll(query: any) {
    const { status } = query;
    const { limit, offset } = parsePagination(query);
    
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const { count, rows } = await this.mergeRequestModel.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'merger', attributes: ['id', 'username', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const list = rows.map(item => ({
      ...item.toJSON(),
      creator_name: item.creator?.username,
      assignee_name: item.assignee?.username,
      merger_name: item.merger?.username,
    }));

    return formatPaginationResponse(list, count);
  }

  async findOne(id: number) {
    const mergeRequest = await this.mergeRequestModel.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'merger', attributes: ['id', 'username', 'email'] },
      ],
    });

    if (!mergeRequest) {
      throw new NotFoundException('合并请求不存在');
    }

    return {
      ...mergeRequest.toJSON(),
      creator_name: mergeRequest.creator?.username,
      assignee_name: mergeRequest.assignee?.username,
      merger_name: mergeRequest.merger?.username,
    };
  }

  async create(createDto: CreateMergeRequestDto, creatorId: number) {
    const data: any = {
      ...createDto,
      creator_id: creatorId,
      title: createDto.merge_url,
      source_branch: '-',
      target_branch: '-',
    };

    if (!data.repository_url) {
      data.repository_url = null;
    }

    const mergeRequest = await this.mergeRequestModel.create(data);
    return this.findOne(mergeRequest.id);
  }

  async update(id: number, updateDto: UpdateMergeRequestDto, user: any) {
    const mergeRequest = await this.mergeRequestModel.findByPk(id);
    if (!mergeRequest) {
      throw new NotFoundException('合并请求不存在');
    }

    if (mergeRequest.creator_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('没有权限修改此合并请求');
    }

    const updateData: any = { ...updateDto };

    // 如果状态改为已合并，记录合并人和合并时间
    if (updateDto.status === 'merged' && mergeRequest.status !== 'merged') {
      updateData.merged_by = user.id;
      updateData.merged_at = new Date();
    }

    await mergeRequest.update(updateData);
    return this.findOne(id);
  }

  async remove(id: number, user: any) {
    const mergeRequest = await this.mergeRequestModel.findByPk(id);
    if (!mergeRequest) {
      throw new NotFoundException('合并请求不存在');
    }

    if (mergeRequest.creator_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('没有权限删除此合并请求');
    }

    await mergeRequest.destroy();
  }
}