import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 添加 xiuno_session_id 字段
  await knex.schema.table('posts', (table) => {
    table.string('xiuno_session_id', 100).nullable();
  });

  // SQLite 不支持直接修改枚举，需要重建列
  // 如果使用 MySQL，可以用 ALTER 语句
  const dbType = knex.client.config.client;
  
  if (dbType === 'sqlite3' || dbType === 'sqlite') {
    // SQLite: 需要重建表
    await knex.schema.raw(`
      CREATE TABLE posts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        title TEXT NOT NULL,
        board TEXT,
        tags TEXT,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'success' CHECK(status IN ('success', 'failed', 'pending_captcha')),
        error_message TEXT,
        creator_id INTEGER,
        xiuno_session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    await knex.raw(`
      INSERT INTO posts_new (id, username, password, title, board, tags, content, status, error_message, creator_id, xiuno_session_id, created_at, updated_at)
      SELECT id, username, password, title, board, tags, content, status, error_message, creator_id, NULL, created_at, updated_at
      FROM posts
    `);
    
    await knex.schema.dropTable('posts');
    await knex.schema.renameTable('posts_new', 'posts');
  } else {
    // MySQL: 直接修改枚举
    await knex.schema.raw(`
      ALTER TABLE posts MODIFY COLUMN status ENUM('success', 'failed', 'pending_captcha') DEFAULT 'success'
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  const dbType = knex.client.config.client;
  
  if (dbType === 'sqlite3' || dbType === 'sqlite') {
    // 恢复原表结构
    await knex.schema.raw(`
      CREATE TABLE posts_old (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        title TEXT NOT NULL,
        board TEXT,
        tags TEXT,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'success' CHECK(status IN ('success', 'failed')),
        error_message TEXT,
        creator_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    await knex.raw(`
      INSERT INTO posts_old SELECT id, username, password, title, board, tags, content, status, error_message, creator_id, created_at, updated_at
      FROM posts
      WHERE status IN ('success', 'failed')
    `);
    
    await knex.schema.dropTable('posts');
    await knex.schema.renameTable('posts_old', 'posts');
  } else {
    await knex.schema.table('posts', (table) => {
      table.dropColumn('xiuno_session_id');
    });
    
    await knex.schema.raw(`
      ALTER TABLE posts MODIFY COLUMN status ENUM('success', 'failed') DEFAULT 'success'
    `);
  }
}
