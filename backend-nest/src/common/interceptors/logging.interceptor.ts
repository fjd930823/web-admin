import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { OperationLogsService } from '../../operation-logs/operation-logs.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // 跳过登录接口和操作日志接口本身
    if (
      request.path === '/api/auth/login' ||
      request.path.startsWith('/api/operation-logs')
    ) {
      return next.handle();
    }

    // 只记录需要认证的接口
    const user = request.user;
    if (!user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(
        (data) => {
          const duration = Date.now() - startTime;
          const { method, path, body, query, params, ip, headers } = request;

          // 解析模块和操作
          const pathParts = path.replace('/api/', '').split('/');
          const module = pathParts[0] || 'unknown';
          const action = this.getActionFromMethod(method, pathParts);

          // 记录日志
          this.operationLogsService.createLog({
            user_id: user.id,
            username: user.username,
            action,
            module,
            method,
            path,
            params: JSON.stringify({ body, query, params }),
            ip: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
            user_agent: headers['user-agent'],
            status_code: response.statusCode,
            duration,
          });
        },
        (error) => {
          const duration = Date.now() - startTime;
          const { method, path, body, query, params, ip, headers } = request;

          const pathParts = path.replace('/api/', '').split('/');
          const module = pathParts[0] || 'unknown';
          const action = this.getActionFromMethod(method, pathParts);

          // 记录错误日志
          this.operationLogsService.createLog({
            user_id: user.id,
            username: user.username,
            action,
            module,
            method,
            path,
            params: JSON.stringify({ body, query, params }),
            ip: ip || headers['x-forwarded-for'] || headers['x-real-ip'],
            user_agent: headers['user-agent'],
            status_code: error.status || 500,
            error_message: error.message || '未知错误',
            duration,
          });
        },
      ),
    );
  }

  private getActionFromMethod(method: string, pathParts: string[]): string {
    const methodMap: Record<string, string> = {
      GET: 'view',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    // 特殊路径处理
    if (pathParts.includes('login')) return 'login';
    if (pathParts.includes('logout')) return 'logout';
    if (pathParts.includes('export')) return 'export';
    if (pathParts.includes('import')) return 'import';

    return methodMap[method] || method.toLowerCase();
  }
}
