import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('xiuno_tokens', (table) => {
    table.increments('id').primary();
    table.string('username', 255).notNullable().unique();
    table.text('token').notNullable();
    table.text('cookies').nullable();
    table.integer('user_id').unsigned().nullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('expires_at').notNullable();
    
    table.index('username');
    table.index('expires_at');
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('xiuno_tokens');
}
