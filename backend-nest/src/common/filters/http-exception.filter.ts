import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errorDetails = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = {
        stack: exception.stack,
      };
    }

    // 记录错误日志
    const errorLog = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message,
      error: errorDetails,
      body: request.body,
      params: request.params,
      query: request.query,
    };

    if (status >= 500) {
      this.logger.error('Internal Server Error:', JSON.stringify(errorLog, null, 2));
    } else if (status >= 400) {
      this.logger.warn('Client Error:', JSON.stringify(errorLog, null, 2));
    }

    // 返回响应
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV === 'development' && errorDetails ? { details: errorDetails } : {}),
    });
  }
}
