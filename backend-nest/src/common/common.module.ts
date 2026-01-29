import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './services/webhook.service';
import { XiunoService } from './services/xiuno.service';
import { StatisticsService } from './services/statistics.service';
import { StatisticsController } from './controllers/statistics.controller';
import { KnexModule } from '../database/knex.module';

@Global()
@Module({
  imports: [HttpModule, KnexModule],
  controllers: [StatisticsController],
  providers: [WebhookService, XiunoService, StatisticsService],
  exports: [WebhookService, XiunoService, StatisticsService],
})
export class CommonModule {}