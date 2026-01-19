import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('posts', (table) => {
    table.dropColumn('password');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('posts', (table) => {
    table.string('password', 255).notNullable().defaultTo('');
  });
}
