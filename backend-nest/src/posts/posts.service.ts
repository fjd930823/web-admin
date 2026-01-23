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
    
    // Token 配置文件路径
    // 无论开发还是生产环境，代码都运行在 dist 目录下
    // __dirname 是 backend-nest/dist/src/posts，需要返回到 backend-nest 根目录
    this.tokenConfigPath = path.join(__dirname, '../../../xiuno-tokens.conf');
    
    this.logger.log(`Token 配置文件路径: ${this.tokenConfigPath}`);
    this.logger.log(`__dirname: ${__dirname}`);
    this.logger.log(`文件是否存在: ${fs.existsSync(this.tokenConfigPath)}`);
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

  /**
   * 上传图片到论坛
   */
  async uploadImage(imageData: {
    is_image: string;
    width: number;
    height: number;
    name: string;
    data: string;
  }): Promise<{ success: boolean; url?: string; message?: string; width?: number; height?: number }> {
    try {
      const axios = require('axios');
      
      this.logger.log(`开始上传图片: ${imageData.name}`);
      this.logger.log(`图片尺寸: ${imageData.width}x${imageData.height}`);
      
      // 构造上传数据
      const formData = new URLSearchParams();
      formData.append('is_image', imageData.is_image);
      formData.append('width', imageData.width.toString());
      formData.append('height', imageData.height.toString());
      formData.append('name', imageData.name);
      formData.append('data', imageData.data);
      
      // 从配置文件获取第一个可用的 token（用于上传图片）
      const token = this.getFirstAvailableToken();
      
      if (!token) {
        this.logger.error('未找到可用的 Token 用于上传图片');
        return {
          success: false,
          message: '未找到可用的 Token，请配置 xiuno-tokens.conf',
        };
      }
      
      this.logger.log(`使用 Token 前缀: ${token.substring(0, 20)}...`);
      
      // 发送上传请求
      const response = await axios.post(
        `${this.xiunoBaseUrl}?attach-create.htm`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': `bbs_token=${token}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
            'Referer': `${this.xiunoBaseUrl}?thread-create-0.htm`,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'text/plain, */*; q=0.01',
          },
          timeout: 30000, // 图片上传可能需要更长时间
        }
      );
      
      this.logger.log(`===== 图片上传响应 =====`);
      this.logger.log(`状态码: ${response.status}`);
      this.logger.log(`响应数据: ${JSON.stringify(response.data)}`);
      this.logger.log(`========================`);
      
      // 解析响应
      if (response.data && typeof response.data === 'object') {
        const code = response.data.code;
        const message = response.data.message;
        
        if (code === '0' || code === 0) {
          // 上传成功
          this.logger.log(`✓ 图片上传成功: ${message.url}`);
          return {
            success: true,
            url: message.url,
            width: message.width,
            height: message.height,
          };
        } else {
          this.logger.warn(`图片上传失败 - 错误码: ${code}`);
          return {
            success: false,
            message: `图片上传失败(错误码:${code})`,
          };
        }
      } else {
        this.logger.error(`无法解析的响应格式`);
        return {
          success: false,
          message: '图片上传失败：服务器返回了无法识别的响应格式',
        };
      }
    } catch (error) {
      this.logger.error(`图片上传异常: ${error.message}`);
      
      if (error.response) {
        this.logger.error(`响应状态: ${error.response.status}`);
        this.logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
      }
      
      return {
        success: false,
        message: `图片上传失败: ${error.message}`,
      };
    }
  }

  /**
   * 上传远程图片到论坛
   */
  async uploadRemoteImage(imageUrl: string): Promise<{ success: boolean; url?: string; message?: string; width?: number; height?: number }> {
    try {
      const axios = require('axios');
      
      this.logger.log(`开始下载远程图片: ${imageUrl}`);
      
      // 下载远程图片
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      
      // 将图片转换为 base64
      const base64Data = `data:${imageResponse.headers['content-type']};base64,${Buffer.from(imageResponse.data, 'binary').toString('base64')}`;
      
      // 获取图片尺寸（使用 sharp 库或简单解析）
      // 这里简单处理，使用默认尺寸，实际应该解析图片
      let width = 800;
      let height = 600;
      
      // 尝试从内容中获取实际尺寸（如果是常见格式）
      try {
        const buffer = Buffer.from(imageResponse.data, 'binary');
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
          // JPEG 格式
          const dimensions = this.getJpegDimensions(buffer);
          if (dimensions) {
            width = dimensions.width;
            height = dimensions.height;
          }
        } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
          // PNG 格式
          const dimensions = this.getPngDimensions(buffer);
          if (dimensions) {
            width = dimensions.width;
            height = dimensions.height;
          }
        }
      } catch (e) {
        this.logger.warn(`无法解析图片尺寸: ${e.message}`);
      }
      
      this.logger.log(`图片尺寸: ${width}x${height}`);
      
      // 生成文件名
      const ext = imageResponse.headers['content-type'].split('/')[1] || 'jpg';
      const filename = `remote_${Date.now()}.${ext}`;
      
      // 调用上传接口
      const uploadResult = await this.uploadImage({
        is_image: '1',
        width,
        height,
        name: filename,
        data: base64Data,
      });
      
      return uploadResult;
    } catch (error) {
      this.logger.error(`远程图片上传失败: ${error.message}`);
      return {
        success: false,
        message: `远程图片上传失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取 JPEG 图片尺寸
   */
  private getJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
      let offset = 2; // 跳过 SOI 标记
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        
        const marker = buffer[offset + 1];
        offset += 2;
        
        // SOF 标记
        if (marker >= 0xC0 && marker <= 0xC3) {
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);
          return { width, height };
        }
        
        // 跳过其他段
        const segmentLength = buffer.readUInt16BE(offset);
        offset += segmentLength;
      }
    } catch (e) {
      // 忽略错误
    }
    return null;
  }

  /**
   * 获取 PNG 图片尺寸
   */
  private getPngDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
      // PNG 头部固定格式：前 8 字节是签名，然后是 IHDR 块
      if (buffer.length < 24) return null;
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    } catch (e) {
      // 忽略错误
    }
    return null;
  }

  /**
   * 获取第一个可用的 token（用于图片上传等操作）
   */
  private getFirstAvailableToken(): string | null {
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
          continue;
        }

        // 检查是否已过期
        if (expiresAt && expiresAt < new Date()) {
          continue;
        }

        // 返回第一个有效的 token
        return token;
      }

      return null;
    } catch (error) {
      this.logger.error(`读取 Token 配置文件失败: ${error.message}`);
      return null;
    }
  }
}
