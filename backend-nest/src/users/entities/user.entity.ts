import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Task } from '../../tasks/entities/task.entity';
import { MergeRequest } from '../../merge-requests/entities/merge-request.entity';

@Table({ tableName: 'users', underscored: true })
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  username: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.ENUM('admin', 'user'),
    defaultValue: 'user',
  })
  role: string;

  @HasMany(() => Task, 'creator_id')
  createdTasks: Task[];

  @HasMany(() => Task, 'assignee_id')
  assignedTasks: Task[];

  @HasMany(() => MergeRequest, 'creator_id')
  createdMergeRequests: MergeRequest[];

  @HasMany(() => MergeRequest, 'merged_by')
  mergedRequests: MergeRequest[];
}