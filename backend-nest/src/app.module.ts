import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { MergeRequestsModule } from './merge-requests/merge-requests.module';
import { PostsModule } from './posts/posts.module';
import { SearchModule } from './search/search.module';
import { KnexModule } from './database/knex.module';

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
  ],
})
export class AppModule {}
