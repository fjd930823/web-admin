import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './services/webhook.service';
import { XiunoService } from './services/xiuno.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [WebhookService, XiunoService],
  exports: [WebhookService, XiunoService],
})
export class CommonModule {}