import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('cloud_accounts', (table) => {
    table.increments('id').primary();
    table.string('username', 255).notNullable().unique();
    table.string('email', 255).notNullable();
    table.string('password', 255).notNullable(); // 加密后的密码
    table.string('captcha_token', 255); // 验证码token
    table.string('session_id', 255); // 会话ID
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cloud_accounts');
}