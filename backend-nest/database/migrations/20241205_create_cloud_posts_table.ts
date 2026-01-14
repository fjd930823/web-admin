import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('cloud_posts', (table) => {
    table.increments('id').primary();
    table.integer('account_id').unsigned().notNullable();
    table.string('post_id', 255).notNullable(); // 社区帖子ID
    table.string('title', 500).notNullable();
    table.text('content');
    table.string('category', 255);
    table.string('status', 50).defaultTo('published'); // published, deleted
    table.timestamp('published_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('account_id').references('id').inTable('cloud_accounts');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cloud_posts');
}
