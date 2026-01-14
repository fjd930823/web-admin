import { Global, Module } from '@nestjs/common';
import { knex, Knex } from 'knex';
import * as path from 'path';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';

const knexProvider = {
  provide: KNEX_CONNECTION,
  useFactory: (): Knex => {
    const knexInstance = knex({
      client: 'sqlite3',
      connection: {
        filename: path.join(process.cwd(), 'database', 'database.sqlite'),
      },
      useNullAsDefault: true,
      migrations: {
        directory: path.join(process.cwd(), 'database', 'migrations'),
        extension: 'ts',
      },
    });

    return knexInstance;
  },
};

@Global()
@Module({
  providers: [knexProvider],
  exports: [KNEX_CONNECTION],
})
export class KnexModule {}
