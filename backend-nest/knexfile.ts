import type { Knex } from 'knex';
import * as path from 'path';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'database', 'database.sqlite'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'database', 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, 'database', 'seeds'),
      extension: 'ts',
    },
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'database', 'database.sqlite'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'database', 'migrations'),
      extension: 'ts',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default config;
