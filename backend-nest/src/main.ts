import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { KNEX_CONNECTION } from './database/knex.module';
import { initializeDatabase } from './database/database.providers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

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
