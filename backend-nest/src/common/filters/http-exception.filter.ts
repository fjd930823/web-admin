import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${exception.constructor.name}: ${exception.message}`,
      exception.stack,
    );

    let status = 500;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else {
      // 记录非Http异常的详细信息
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}