import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MergeRequestsService } from './merge-requests.service';
import { MergeRequestsController } from './merge-requests.controller';
import { MergeRequest } from './entities/merge-request.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([MergeRequest, User])],
  controllers: [MergeRequestsController],
  providers: [MergeRequestsService],
})
export class MergeRequestsModule {}