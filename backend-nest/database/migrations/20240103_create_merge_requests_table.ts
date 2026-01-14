import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('merge_requests', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('source_branch', 100).notNullable();
    table.string('target_branch', 100).notNullable();
    table.string('repository_url', 500);
    table.string('merge_url', 500).notNullable();
    table.enum('status', ['pending', 'approved', 'rejected', 'merged']).defaultTo('pending');
    table.integer('creator_id').unsigned().notNullable();
    table.integer('assignee_id').unsigned().nullable();
    table.integer('merged_by').unsigned().nullable();
    table.datetime('merged_at').nullable();
    table.timestamps(true, true);

    // Foreign keys
    table.foreign('creator_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('assignee_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('merged_by').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('merge_requests');
}
