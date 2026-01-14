import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('posts', (table) => {
    table.increments('id').primary();
    table.string('username', 255).notNullable();
    table.string('password', 255).notNullable();
    table.string('title', 255).notNullable();
    table.text('content').notNullable();
    table.enum('status', ['success', 'failed']).defaultTo('success');
    table.text('error_message').nullable();
    table.integer('creator_id').unsigned().nullable();
    table.timestamps(true, true);

    // Foreign key
    table.foreign('creator_id').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('posts');
}
