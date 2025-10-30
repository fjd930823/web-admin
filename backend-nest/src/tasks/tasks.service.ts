import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './dto/create-task.dto';
import { parsePagination, formatPaginationResponse } from '../common/utils/pagination.util';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task)
    private taskModel: typeof Task,
  ) {}

  async findAll(query: any) {
    const { status, assignee_id, year, month } = query;
    const { limit, offset } = parsePagination(query, 1000);
    
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (assignee_id !== undefined) {
      where.assignee_id = assignee_id === 0 ? null : assignee_id;
    }
    if (year && month) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      where.start_date = { [Op.between]: [startOfMonth, endOfMonth] };
    } else if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      where.start_date = { [Op.between]: [startOfYear, endOfYear] };
    }

    const { count, rows } = await this.taskModel.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'email'] },
      ],
      order: [['sort_order', 'ASC'], ['createdAt', 'DESC']],
      limit,
      offset,
    });

    const list = rows.map(item => ({
      ...item.toJSON(),
      creator_name: item.creator?.username,
      assignee_name: item.assignee?.username,
    }));

    return { list, total: count };
  }

  async findOne(id: number) {
    const task = await this.taskModel.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'username', 'email'] },
      ],
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    return {
      ...task.toJSON(),
      creator_name: task.creator?.username,
      assignee_name: task.assignee?.username,
    };
  }

  async create(createTaskDto: CreateTaskDto, creatorId: number) {
    const task = await this.taskModel.create({
      ...createTaskDto,
      creator_id: creatorId,
    });

    return this.findOne(task.id);
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: any) {
    const task = await this.taskModel.findByPk(id);
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.creator_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('没有权限修改此任务');
    }

    await task.update(updateTaskDto);
    return this.findOne(id);
  }

  async updateStatus(id: number, updateStatusDto: UpdateTaskStatusDto) {
    const task = await this.taskModel.findByPk(id);
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    await task.update(updateStatusDto);
    return this.findOne(id);
  }

  async remove(id: number, user: any) {
    const task = await this.taskModel.findByPk(id);
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.creator_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('没有权限删除此任务');
    }

    await task.destroy();
  }
}