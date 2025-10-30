import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'tasks', underscored: true })
export class Task extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
  })
  description: string;

  @Column({
    type: DataType.ENUM('todo', 'in_progress', 'dev_complete', 'testing', 'deployed', 'archived'),
    defaultValue: 'todo',
  })
  status: string;

  @Column({
    type: DataType.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
  })
  priority: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  assignee_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  creator_id: number;

  @Column({
    type: DataType.DATE,
  })
  start_date: Date;

  @Column({
    type: DataType.DATE,
  })
  due_date: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sort_order: number;

  @BelongsTo(() => User, 'creator_id')
  creator: User;

  @BelongsTo(() => User, 'assignee_id')
  assignee: User;
}