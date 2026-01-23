import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { KNEX_CONNECTION } from './database/knex.module';
import { initializeDatabase } from './database/database.providers';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: false,
  });

  // 增加请求体大小限制（用于处理富文本内容和图片）
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(require('body-parser').json({ limit: '50mb' }));
  expressApp.use(require('body-parser').urlencoded({ limit: '50mb', extended: true }));

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // 启用全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 启用 CORS
  app.enableCors();

  // 获取 Knex 实例并初始化数据库
  const knex = app.get(KNEX_CONNECTION);
  await initializeDatabase(knex);

  const port = process.env.PORT || 7001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
