import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Knex from 'knex';
import * as path from 'path';

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
            filename: path.join(process.cwd(), 'database', 'database.sqlite'),
	          extension: 'ts',
          },
          useNullAsDefault: true,
	        migrations: {
		        directory: path.join(process.cwd(), 'database', 'migrations'),
		        extension: 'ts',
	        },
        };
        
        return Knex.default(knexConfig);
      },
      inject: [ConfigService],
    },
  ],
  exports: [KNEX_CONNECTION],
})
export class KnexModule {}
