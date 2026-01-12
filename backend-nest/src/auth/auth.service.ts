import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';
import { KNEX_CONNECTION } from '../database/knex.module';
import { LoginDto, RegisterDto } from './dto/login.dto';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    
    const user = await this.knex<User>('users')
      .where({ username })
      .first();

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // 检查用户名是否存在
    const existingUser = await this.knex<User>('users')
      .where({ username })
      .first();
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否存在
    const existingEmail = await this.knex<User>('users')
      .where({ email })
      .first();
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [id] = await this.knex<User>('users').insert({
      username,
      email,
      password: hashedPassword,
      role: 'user',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const user = await this.knex<User>('users').where({ id }).first();

    return {
      id: user!.id,
      username: user!.username,
      email: user!.email,
      role: user!.role,
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.knex<User>('users')
      .where({ id: userId })
      .select('id', 'username', 'email', 'role')
      .first();
    return user || null;
  }
}
