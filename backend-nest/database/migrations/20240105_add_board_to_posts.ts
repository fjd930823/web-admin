import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('posts', (table) => {
    table.string('board', 50).notNullable().defaultTo('资源互助').after('title');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('posts', (table) => {
    table.dropColumn('board');
  });
}
