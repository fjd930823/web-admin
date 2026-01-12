import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

/**
 * 初始化数据库
 * 创建默认管理员账号
 */
export async function initializeDatabase(knex: Knex): Promise<void> {
  console.log('初始化数据库...');

  try {
    // 检查是否已经存在管理员账号
    const adminUser = await knex('users').where({ username: 'admin' }).first();

    if (!adminUser) {
      console.log('创建默认管理员账号...');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await knex('users').insert({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      });

      console.log('✅ 默认管理员账号创建成功');
      console.log('👤 用户名: admin');
      console.log('🔑 密码: admin123');
    } else {
      console.log('✅ 管理员账号已存在');
    }
  } catch (error) {
    console.error('❌ 初始化数据库失败:', error);
    throw error;
  }
}
