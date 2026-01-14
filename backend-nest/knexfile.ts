import { Knex } from 'knex';

const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: './database/database.sqlite',
  },
  migrations: {
    directory: './database/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './database/seeds',
  },
  useNullAsDefault: true,
};

export default config;