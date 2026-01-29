import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OperationLogsService } from './operation-logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('operation-logs')
@UseGuards(JwtAuthGuard)
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Get()
  async getLogs(@Query() query: QueryLogsDto, @CurrentUser() user: any) {
    // 只有admin可以查看操作日志
    if (user.role !== 'admin') {
      return {
        success: false,
        message: '无权访问',
      };
    }

    const result = await this.operationLogsService.getLogs(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats/actions')
  async getActionStats(@CurrentUser() user: any) {
    if (user.role !== 'admin') {
      return {
        success: false,
        message: '无权访问',
      };
    }

    const data = await this.operationLogsService.getActionStats();
    return {
      success: true,
      data,
    };
  }

  @Get('stats/modules')
  async getModuleStats(@CurrentUser() user: any) {
    if (user.role !== 'admin') {
      return {
        success: false,
        message: '无权访问',
      };
    }

    const data = await this.operationLogsService.getModuleStats();
    return {
      success: true,
      data,
    };
  }
}
