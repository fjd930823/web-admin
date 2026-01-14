import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('posts', (table) => {
    table.text('tags').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('posts', (table) => {
    table.dropColumn('tags');
  });
}
