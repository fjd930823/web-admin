import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('operation_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('username', 50).notNullable();
    table.string('action', 50).notNullable(); // 操作类型：create, update, delete, login等
    table.string('module', 50).notNullable(); // 模块：users, tasks, posts等
    table.string('method', 10).notNullable(); // HTTP方法：GET, POST, PUT, DELETE
    table.string('path', 255).notNullable(); // 请求路径
    table.text('params').nullable(); // 请求参数（JSON）
    table.string('ip', 50).nullable(); // IP地址
    table.string('user_agent', 500).nullable(); // 用户代理
    table.integer('status_code').nullable(); // 响应状态码
    table.text('error_message').nullable(); // 错误信息
    table.integer('duration').nullable(); // 执行时长（毫秒）
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());

    // 添加索引
    table.index('user_id');
    table.index('action');
    table.index('module');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('operation_logs');
}
