import { Module } from '@nestjs/common';
import { MergeRequestsService } from './merge-requests.service';
import { MergeRequestsController } from './merge-requests.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [MergeRequestsController],
  providers: [MergeRequestsService],
})
export class MergeRequestsModule {}
