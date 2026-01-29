import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { MergeRequestsModule } from './merge-requests/merge-requests.module';
import { PostsModule } from './posts/posts.module';
import { SearchModule } from './search/search.module';
import { KnexModule } from './database/knex.module';
import { TokensModule } from './tokens/tokens.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    KnexModule,
    CommonModule,
    AuthModule,
    UsersModule,
    TasksModule,
    MergeRequestsModule,
    PostsModule,
    SearchModule,
    TokensModule,
    OperationLogsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
