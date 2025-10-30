import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'merge_requests', underscored: true })
export class MergeRequest extends Model {
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
    type: DataType.STRING(100),
    allowNull: false,
  })
  source_branch: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  target_branch: string;

  @Column({
    type: DataType.STRING(500),
  })
  repository_url: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  merge_url: string;

  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected', 'merged'),
    defaultValue: 'pending',
  })
  status: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  creator_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  assignee_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  merged_by: number;

  @Column({
    type: DataType.DATE,
  })
  merged_at: Date;

  @BelongsTo(() => User, 'creator_id')
  creator: User;

  @BelongsTo(() => User, 'assignee_id')
  assignee: User;

  @BelongsTo(() => User, 'merged_by')
  merger: User;
}