import { Injectable, Inject, Logger } from '@nestjs/common';
import { KNEX_CONNECTION } from '@/database/knex.module';
import { Knex } from 'knex';
import axios, { AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import { CaptchaService } from './captcha.service';

export interface CloudAccount {
  id: number;
  username: string;
  email: string;
  password: string;
  captcha_token?: string;
  session_id?: string;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CloudPost {
  id: number;
  account_id: number;
  post_id: string;
  title: string;
  content?: string;
  category?: string;
  status: string;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCloudAccountDto {
  username: string;
  email: string;
  password: string; // 明文密码，将在服务中加密
  is_active?: boolean;
}

export interface CreateCloudPostDto {
  title: string;
  content: string;
  category: string;
  account_id: number;
}

@Injectable()
export class CloudCommunityService {
  private readonly logger = new Logger(CloudCommunityService.name);

  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
    private readonly captchaService: CaptchaService,
  ) {}

  /**
   * 创建云盘社区账号
   */
  async createAccount(createAccountDto: CreateCloudAccountDto): Promise<CloudAccount> {
    const { username, email, password, is_active = true } = createAccountDto;
    
    // 检查账号是否已存在
    const existingAccount = await this.knex<CloudAccount>('cloud_accounts')
      .where({ username })
      .first();
    
    if (existingAccount) {
      throw new Error('账号已存在');
    }

    // 密码需要以123云盘社区要求的格式存储
    const hashedPassword = this.hashFor123pan(password);

    const [id] = await this.knex<CloudAccount>('cloud_accounts').insert({
      username,
      email,
      password: hashedPassword,
      is_active,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.getAccountById(id);
  }

  /**
   * 获取账号详情
   */
  async getAccountById(id: number): Promise<CloudAccount | null> {
    return this.knex<CloudAccount>('cloud_accounts')
      .where({id})
      .first();
  }

  /**
   * 获取所有账号
   */
  async getAllAccounts(): Promise<CloudAccount[]> {
    return this.knex<CloudAccount>('cloud_accounts')
      .where({is_active: true});
  }

  /**
   * 更新账号会话信息
   */
  async updateAccountSession(accountId: number, sessionId: string, captchaToken?: string): Promise<void> {
    const updateData: any = {
      session_id: sessionId,
      last_login_at: new Date(),
      updated_at: new Date(),
    };

    if (captchaToken) {
      updateData.captcha_token = captchaToken;
    }

    await this.knex<CloudAccount>('cloud_accounts')
      .where({ id: accountId })
      .update(updateData);
  }
  
  private hashFor123pan(password: string): string {
    return crypto.createHash('md5').update(password).digest('hex');
  }

  /**
   * 处理滑块验证
   */
  private async handleCaptcha(account: CloudAccount): Promise<any> {
    try {
      // 尝试使用Puppeteer处理滑块验证
      this.logger.log(`为账号 ${account.username} 处理滑块验证`);
      return await this.captchaService.solveCaptcha(account);
    } catch (error) {
      this.logger.warn(`自动处理滑块验证失败: ${error.message}，使用模拟验证`);
      // 如果自动处理失败，返回模拟数据
      return await this.captchaService.mockCaptcha();
    }
  }

  /**
   * 登录到云盘社区
   */
  async loginToCommunity(accountId: number): Promise<{ success: boolean; sessionId?: string; captchaToken?: string; error?: string }> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) {
        return { success: false, error: '账号不存在' };
      }

      // 检查是否需要处理滑块验证
      const captchaData = await this.handleCaptcha(account);
      
      // 发送登录请求
      const loginUrl = 'https://123panfx.com/?user-login.htm';
      
      let dataStr = `email=${encodeURIComponent(account.email)}&password=${account.password}`;
      
      if (captchaData.lot_number) {
        dataStr += `&lot_number=${captchaData.lot_number}`;
      }
      
      if (captchaData.captcha_output) {
        dataStr += `&captcha_output=${captchaData.captcha_output}`;
      }
      
      if (captchaData.pass_token) {
        dataStr += `&pass_token=${captchaData.pass_token}`;
      }
      
      if (captchaData.gen_time) {
        dataStr += `&gen_time=${captchaData.gen_time}`;
      }

      const config: AxiosRequestConfig = {
        method: 'POST',
        url: loginUrl,
        headers: {
          'accept': 'text/plain, */*; q=0.01',
          'accept-language': 'zh-CN,zh;q=0.9',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'priority': 'u=1, i',
          'referer': 'https://123panfx.com/?user-login.htm',
          'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest',
        },
        data: dataStr,
      };

      const response = await axios(config);

      // 提取会话ID（从Set-Cookie中）
      const cookies = response.headers['set-cookie'];
      let sessionId = '';
      if (cookies) {
        const sessionCookie = cookies.find(cookie => cookie.includes('bbs_sid'));
        if (sessionCookie) {
          const match = sessionCookie.match(/bbs_sid=([^;]+)/);
          if (match) {
            sessionId = match[1];
          }
        }
      }

      if (response.status === 200 && sessionId) {
        // 保存会话ID
        await this.updateAccountSession(accountId, sessionId);
        return { success: true, sessionId };
      } else {
        return { success: false, error: '登录失败' };
      }
    } catch (error) {
      this.logger.error(`登录失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async createPostInCommunity(createPostDto: CreateCloudPostDto): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const account = await this.getAccountById(createPostDto.account_id);
      if (!account || !account.session_id) {
        return { success: false, error: '账号不存在或未登录' };
      }

      const postUrl = 'https://123panfx.com/?thread-create.htm';
      
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: postUrl,
        headers: {
          'accept': 'text/plain, */*; q=0.01',
          'accept-language': 'zh-CN,zh;q=0.9',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'cookie': `bbs_sid=${account.session_id}; _clck=1e37rpq%5E2%5Eg2p%5E0%5E2205; bbs_token=; _clsk=1gxbswh%5E1768369582423%5E21%5E1%5En.clarity.ms%2Fcollect`,
          'priority': 'u=1, i',
          'referer': 'https://123panfx.com/?thread-create-0.htm',
          'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest',
        },
        data: `doctype=0&epid=0&subject=${encodeURIComponent(createPostDto.title)}&message=${encodeURIComponent(createPostDto.content || '')}&vod_url=&http_url=&fid=43&tagid%5B%5D=&tagid%5B%5D=&tagid%5B%5D=167&tagid%5B%5D=168&tagid%5B%5D=`,
      };

      const response = await axios(config);

      if (response.status === 200) {
        // 从响应中提取帖子ID（假设返回的是帖子ID）
        const postId = this.extractPostIdFromResponse(response.data);
        
        // 保存帖子记录
        await this.savePostRecord({
          account_id: createPostDto.account_id,
          post_id: postId || 'unknown',
          title: createPostDto.title,
          content: createPostDto.content,
          category: createPostDto.category,
          status: 'published',
          published_at: new Date(),
        });

        return { success: true, postId };
      } else {
        return { success: false, error: `发帖失败，状态码: ${response.status}` };
      }
    } catch (error) {
      this.logger.error(`发帖失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  async deletePostFromCommunity(accountId: number, postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account || !account.session_id) {
        return { success: false, error: '账号不存在或未登录' };
      }

      const deleteUrl = `https://123panfx.com/?post-delete-${postId}.htm`;
      
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: deleteUrl,
        headers: {
          'accept': 'text/plain, */*; q=0.01',
          'accept-language': 'zh-CN,zh;q=0.9',
          'content-length': '0',
          'cookie': `bbs_sid=${account.session_id}; _clck=1e37rpq%5E2%5Eg2p%5E0%5E2205; bbs_token=; _clsk=1gxbswh%5E1768370232680%5E30%5E1%5En.clarity.ms%2Fcollect`,
          'priority': 'u=1, i',
          'referer': `https://123panfx.com/?thread-${postId}.htm`,
          'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest',
        },
      };

      const response = await axios(config);

      if (response.status === 200) {
        // 更新帖子状态为已删除
        await this.updatePostStatus(postId, 'deleted');
        return { success: true };
      } else {
        return { success: false, error: `删除帖子失败，状态码: ${response.status}` };
      }
    } catch (error) {
      this.logger.error(`删除帖子失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  private async savePostRecord(post: Omit<CloudPost, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    await this.knex<CloudPost>('cloud_posts').insert({
      ...post,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
  
  private async updatePostStatus(postId: string, status: string): Promise<void> {
    await this.knex<CloudPost>('cloud_posts')
      .where({ post_id: postId })
      .update({ 
        status,
        updated_at: new Date() 
      });
  }
  
  private extractPostIdFromResponse(response: any): string | null {
    // 根据实际响应格式来提取帖子ID
    // 这里是示例，实际需要根据真实响应来实现
    if (typeof response === 'string') {
      // 假设响应中包含帖子ID的某种格式
      const match = response.match(/thread-(\d+)/i);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
  
  async getAllPosts(): Promise<CloudPost[]> {
    return this.knex<CloudPost>('cloud_posts')
      .orderBy('published_at', 'desc');
  }
  
  async getPostsByAccount(accountId: number): Promise<CloudPost[]> {
    return this.knex<CloudPost>('cloud_posts')
      .where({account_id: accountId})
      .orderBy('published_at', 'desc');
  }
}