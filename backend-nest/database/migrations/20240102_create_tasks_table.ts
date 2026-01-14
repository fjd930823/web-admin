import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table
      .enum('status', ['todo', 'in_progress', 'dev_complete', 'testing', 'deployed', 'archived'])
      .defaultTo('todo');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.integer('assignee_id').unsigned().nullable();
    table.integer('creator_id').unsigned().notNullable();
    table.datetime('start_date').nullable();
    table.datetime('due_date').nullable();
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);

    // Foreign keys
    table.foreign('assignee_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('creator_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('tasks');
}
