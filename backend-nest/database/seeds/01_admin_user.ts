import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // 删除已存在的数据
  await knex('users').del();

  // 插入默认管理员账号
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}
