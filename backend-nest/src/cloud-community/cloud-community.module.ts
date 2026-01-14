import { Module } from '@nestjs/common';
import { CloudCommunityService } from './cloud-community.service';
import { CloudCommunityController } from './cloud-community.controller';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [CloudCommunityController],
  providers: [CloudCommunityService],
  exports: [CloudCommunityService],
})
export class CloudCommunityModule {}