import { Injectable, Inject, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/knex.module';
import { CreatePostDto } from './dto/create-post.dto';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface Post {
  id: number;
  username: string;
  title: string;
  board: string;
  tags?: string;
  content: string;
  status: 'success' | 'failed' | 'no_token' | 'token_expired';
  error_message?: string;
  creator_id?: number;
  created_at: Date;
  updated_at: Date;
}

interface TokenConfig {
  token: string;
  expiresAt?: Date;
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly xiunoBaseUrl: string;
  private readonly tokenConfigPath: string;
  
  // 板块名称到 ID 的映射（根据实际论坛配置）
  private readonly boardNameToId: Record<string, string> = {
    '资源互助': '45',
    '反馈': '43',
    '电影': '2',
    '电视剧': '48',
    '动漫': '37',
    '综艺': '52',
    '4K原盘': '56',
    '音频': '40',
    '电子书': '51',
    '设计专区': '42',
    '工具': '57',
    '体育专区': '58',
  };

  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
    private readonly configService: ConfigService,
  ) {
    this.xiunoBaseUrl = this.configService.get<string>('XIUNO_BASE_URL', 'https://www.123panfx.com/');
    
    // Token 配置文件路径（项目根目录）
    this.tokenConfigPath = path.join(process.cwd(), '..', 'xiuno-tokens.conf');
  }
  
  /**
   * 获取板块 ID
   */
  private getBoardId(boardName: string): string {
    const boardId = this.boardNameToId[boardName];
    if (!boardId) {
      this.logger.warn(`未找到板块 "${boardName}" 的 ID 映射，使用原始值`);
      return boardName;
    }
    return boardId;
  }

  /**
   * 从配置文件读取指定账号的 token（每次都读取文件，实现热更新）
   */
  private getTokenConfig(phone: string): TokenConfig | null {
    try {
      if (!fs.existsSync(this.tokenConfigPath)) {
        this.logger.warn(`Token 配置文件不存在: ${this.tokenConfigPath}`);
        return null;
      }

      const content = fs.readFileSync(this.tokenConfigPath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        
        // 跳过注释和空行
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }

        const [configPhone, ...rest] = trimmed.split('=');
        if (!configPhone || rest.length === 0) {
          continue;
        }

        // 检查是否是要找的账号
        if (configPhone.trim() !== phone) {
          continue;
        }

        // 重新组合 rest，因为 token 部分也包含 =
        const tokenInfo = rest.join('=');
        
        // 解析格式：bbs_token=xxx,expires=ISO时间
        const parts = tokenInfo.split(',').map(s => s.trim());
        
        let token = '';
        let expiresAt: Date | undefined;
        
        for (const part of parts) {
          if (part.startsWith('bbs_token=')) {
            token = part.substring('bbs_token='.length);
          } else if (part.startsWith('expires=')) {
            const expiresStr = part.substring('expires='.length);
            const expires = new Date(expiresStr);
            if (!isNaN(expires.getTime())) {
              expiresAt = expires;
            }
          }
        }
        
        if (!token) {
          this.logger.warn(`无效的配置行（缺少 bbs_token）: ${phone}`);
          return null;
        }

        // 检查是否已过期
        if (expiresAt && expiresAt < new Date()) {
          this.logger.warn(`Token 已过期: ${phone} (过期时间: ${expiresAt.toISOString()})`);
          return null;
        }

        const config: TokenConfig = { token };
        if (expiresAt) {
          config.expiresAt = expiresAt;
        }

        return config;
      }

      // 没有找到匹配的账号
      return null;
    } catch (error) {
      this.logger.error(`读取 Token 配置文件失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 创建帖子
   */
  async create(createPostDto: CreatePostDto, userId?: number): Promise<Post> {
    try {
      // 从配置文件获取 token
      const tokenConfig = this.getTokenConfig(createPostDto.username);

      if (!tokenConfig) {
        const errorMsg = `未找到账号 ${createPostDto.username} 的 Token 配置，请在 xiuno-tokens.conf 中添加`;
        
        this.logger.warn(errorMsg);
        
        const [id] = await this.knex<Post>('posts').insert({
          ...createPostDto,
          creator_id: userId,
          status: 'no_token',
          error_message: errorMsg,
          created_at: new Date(),
          updated_at: new Date(),
        });

        const post = await this.knex<Post>('posts').where({ id: id }).first();
        return post!;
      }

      // 使用 token 发帖
      const result = await this.createPostWithToken(tokenConfig.token, createPostDto);

      if (result.success) {
        const [id] = await this.knex<Post>('posts').insert({
          ...createPostDto,
          creator_id: userId,
          status: 'success',
          created_at: new Date(),
          updated_at: new Date(),
        });

        const post = await this.knex<Post>('posts').where({ id: id }).first();
        return post!;
      } else {
        const [id] = await this.knex<Post>('posts').insert({
          ...createPostDto,
          creator_id: userId,
          status: 'failed',
          error_message: result.message,
          created_at: new Date(),
          updated_at: new Date(),
        });

        const post = await this.knex<Post>('posts').where({ id: id }).first();
        return post!;
      }
    } catch (error) {
      const [id] = await this.knex<Post>('posts').insert({
        ...createPostDto,
        creator_id: userId,
        status: 'failed',
        error_message: error.message,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const post = await this.knex<Post>('posts').where({ id: id }).first();
      return post!;
    }
  }

  /**
   * 使用 token 发帖
   */
  private async createPostWithToken(
    token: string,
    postData: CreatePostDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const axios = require('axios');
      
      this.logger.log(`开始发帖: ${postData.title}`);
      this.logger.log(`使用账号: ${postData.username}`);
      this.logger.log(`板块: ${postData.board}`);
      
      // 获取板块 ID
      const boardId = this.getBoardId(postData.board);
      this.logger.log(`板块 ID: ${boardId}`);
      this.logger.log(`Token 前缀: ${token.substring(0, 20)}...`);
      
      // 构造请求体（匹配 Xiuno 论坛的实际格式）
      const requestBody: any = {
        doctype: '0',        // 文档类型
        quotepid: '0',       // 引用的帖子ID（新帖为0）
        subject: postData.title,
        message: postData.content,
        vod_url: '',         // 视频URL（可选）
        http_url: '',        // HTTP链接（可选）
        fid: boardId,
      };
      
      // 添加标签ID（Xiuno 使用多个 tagid[] 参数）
      if (postData.tags) {
        const tagIds = postData.tags.split(',').filter(id => id.trim());
        this.logger.log(`标签 IDs (${tagIds.length}个): ${tagIds.join(', ')}`);
        
        // 注意：标签需要作为数组参数传递，后面会通过 URLSearchParams 处理
        requestBody.tagIds = tagIds; // 临时存储，后面转换为 tagid[]
      }
      
      this.logger.log(`请求参数: subject="${postData.title}", fid=${boardId}, tags=${postData.tags || '无'}`);
      
      // 将请求体转换为 URLSearchParams 格式（application/x-www-form-urlencoded）
      const formData = new URLSearchParams();
      formData.append('doctype', requestBody.doctype);
      formData.append('quotepid', requestBody.quotepid);
      formData.append('subject', requestBody.subject);
      formData.append('message', requestBody.message);
      formData.append('vod_url', requestBody.vod_url);
      formData.append('http_url', requestBody.http_url);
      formData.append('fid', requestBody.fid);
      
      // 添加标签（每个标签ID作为单独的 tagid[] 参数）
      if (requestBody.tagIds && Array.isArray(requestBody.tagIds)) {
        for (const tagId of requestBody.tagIds) {
          formData.append('tagid[]', tagId);
        }
      }
      
      // 记录完整的请求信息
      const formDataString = formData.toString();
      this.logger.log(`===== 发帖请求详情 =====`);
      this.logger.log(`URL: ${this.xiunoBaseUrl}?thread-create.htm`);
      this.logger.log(`Form Data: ${formDataString}`);
      this.logger.log(`Cookie: bbs_token=${token.substring(0, 20)}...`);
      this.logger.log(`========================`);
      
      // 调用 Xiuno API
      const response = await axios.post(
        `${this.xiunoBaseUrl}?thread-create.htm`,
        formDataString,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': `bbs_token=${token}`, // 使用 bbs_token 构造 cookie
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': this.xiunoBaseUrl,
            'X-Requested-With': 'XMLHttpRequest', // 关键：让服务器返回 JSON 而不是 HTML
          },
          timeout: 10000,
        }
      );

      this.logger.log(`===== API 响应 =====`);
      this.logger.log(`状态码: ${response.status}`);
      this.logger.log(`响应类型: ${typeof response.data}`);
      
      // 检查是否是 HTML 响应（可能是登录页面或错误页面）
      if (typeof response.data === 'string') {
        if (response.data.includes('<html') || response.data.includes('<!DOCTYPE')) {
          this.logger.error(`收到 HTML 响应，可能是 Token 无效或需要登录`);
          this.logger.error(`HTML 前100字符: ${response.data.substring(0, 100)}`);
          return {
            success: false,
            message: 'Token 可能已过期，请检查配置文件中的 token 是否有效',
          };
        }
        this.logger.log(`响应数据（字符串）: ${response.data.substring(0, 500)}`);
      } else {
        this.logger.log(`响应数据（JSON）: ${JSON.stringify(response.data)}`);
      }
      this.logger.log(`==================`);

      // 根据 Xiuno 的响应格式判断
      // Xiuno BBS 4.0.4 返回格式：{"code":"0","message":"发帖成功 经验+1 金币+1 "}
      if (response.data && typeof response.data === 'object') {
        const code = response.data.code || response.data.error;
        const message = response.data.message || '未知响应';
        
        // 成功：code 为 "0" 或 0
        if (code === '0' || code === 0) {
          this.logger.log(`✓ 发帖成功: ${message}`);
          return {
            success: true,
            message: message || '发帖成功',
          };
        } else {
          // 失败：code 不为 0
          this.logger.warn(`发帖失败 - 错误码: ${code}, 错误信息: ${message}`);
          return {
            success: false,
            message: message || `发帖失败(错误码:${code})`,
          };
        }
      } else {
        this.logger.error(`无法解析的响应格式`);
        return {
          success: false,
          message: '发帖失败：服务器返回了无法识别的响应格式',
        };
      }
    } catch (error) {
      this.logger.error(`发帖异常: ${error.message}`);
      
      if (error.response) {
        this.logger.error(`响应状态: ${error.response.status}`);
        this.logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
      }
      
      return {
        success: false,
        message: `发帖失败: ${error.message}`,
      };
    }
  }

  async findAll(query: any): Promise<{ data: any[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      status,
      username,
      title,
      sortField = 'created_at',
      sortOrder = 'desc',
    } = query;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    let queryBuilder = this.knex<Post>('posts')
      .leftJoin('users', 'posts.creator_id', 'users.id')
      .select(
        'posts.*',
        'users.username as creator_username',
        'users.email as creator_email',
        'users.id as creator_user_id'
      );

    if (status) {
      queryBuilder = queryBuilder.where('posts.status', status);
    }
    if (username) {
      queryBuilder = queryBuilder.where('posts.username', 'like', `%${username}%`);
    }
    if (title) {
      queryBuilder = queryBuilder.where('posts.title', 'like', `%${title}%`);
    }

    // 获取总数
    const countResult = await queryBuilder.clone().clearSelect().count<{ count: number }>('posts.id as count').first();
    const total = Number(countResult?.count || 0);

    // 获取数据
    const rows = await queryBuilder
      .orderBy(`posts.${sortField}`, sortOrder.toLowerCase())
      .limit(limit)
      .offset(offset);

    // 格式化数据
    const data = rows.map((row: any) => ({
      ...row,
      creator: row.creator_user_id ? {
        id: row.creator_user_id,
        username: row.creator_username,
        email: row.creator_email,
      } : null,
      creator_username: undefined,
      creator_email: undefined,
      creator_user_id: undefined,
    }));

    return {
      data,
      total,
    };
  }

  async remove(id: number): Promise<void> {
    await this.knex<Post>('posts').where({ id }).del();
  }
}
