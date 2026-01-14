import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Knex from 'knex';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';

export interface KnexConfig {
  client: string;
  connection: any;
  migrations?: {
    directory: string;
    extension?: string;
  };
  seeds?: {
    directory: string;
  };
  useNullAsDefault?: boolean;
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KNEX_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const knexConfig: KnexConfig = {
          client: 'sqlite3',
          connection: {
            filename: './database/database.sqlite',
          },
          useNullAsDefault: true,
        };
        
        return Knex.default(knexConfig);
      },
      inject: [ConfigService],
    },
  ],
  exports: [KNEX_CONNECTION],
})
export class KnexModule {}