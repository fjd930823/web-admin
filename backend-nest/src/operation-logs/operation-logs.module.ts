import { Module } from '@nestjs/common';
import { OperationLogsService } from './operation-logs.service';
import { OperationLogsController } from './operation-logs.controller';
import { KnexModule } from '../database/knex.module';

@Module({
  imports: [KnexModule],
  controllers: [OperationLogsController],
  providers: [OperationLogsService],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
