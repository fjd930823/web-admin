import { Sequelize } from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';

export async function initializeDatabase(sequelize: Sequelize) {
  // 同步数据库
  await sequelize.sync();

  // 检查是否需要创建默认管理员
  const adminExists = await User.findOne({
    where: { username: 'admin' },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('默认管理员账号已创建: admin / admin123');
  }
}