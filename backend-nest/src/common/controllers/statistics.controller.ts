import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StatisticsService } from '../services/statistics.service';
import { TaskStatisticsDto, PostStatisticsDto } from '../dto/statistics.dto';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overall')
  async getOverallStatistics() {
    const data = await this.statisticsService.getOverallStatistics();
    return {
      success: true,
      data,
    };
  }

  @Get('archived-tasks-by-user')
  async getArchivedTasksByUser() {
    const data = await this.statisticsService.getArchivedTasksByUser();
    return {
      success: true,
      data,
    };
  }

  @Get('tasks-by-user')
  async getTasksByUser(@Query() query: TaskStatisticsDto) {
    const data = await this.statisticsService.getTasksByUser(
      query.status,
      query.year,
      query.month,
    );
    return {
      success: true,
      data,
    };
  }

  @Get('posts-by-user')
  async getPostsByUser(@Query() query: PostStatisticsDto) {
    const data = await this.statisticsService.getPostsByUser(
      query.startDate,
      query.endDate,
    );
    return {
      success: true,
      data,
    };
  }
}
