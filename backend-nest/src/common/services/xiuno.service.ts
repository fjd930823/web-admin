import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';

// 验证码会话信息
export interface CaptchaSession {
  sessionId: string;
  status: 'pending' | 'completed' | 'failed';
  username: string;
  password: string;
  browser?: Browser;
  page?: Page;
  error?: string;
}

@Injectable()
export class XiunoService {
  private readonly logger = new Logger(XiunoService.name);
  private captchaSessions: Map<string, CaptchaSession> = new Map();
  private loginTokens: Map<string, string> = new Map(); // username -> token

  /**
   * 检查是否已登录（有有效 token）
   */
  isLoggedIn(username: string): boolean {
    return this.loginTokens.has(username);
  }

  /**
   * 获取登录 token
   */
  getToken(username: string): string | undefined {
    return this.loginTokens.get(username);
  }

  /**
   * 开始登录流程 - 打开浏览器让用户完成验证码
   */
  async startLogin(username: string, password: string, xiunoBaseUrl: string): Promise<string> {
    const sessionId = this.generateSessionId();
    
    this.logger.log(`开始登录流程 - Session: ${sessionId}, Username: ${username}`);

    // 创建会话记录
    const session: CaptchaSession = {
      sessionId,
      status: 'pending',
      username,
      password,
    };
    
    this.captchaSessions.set(sessionId, session);

    // 启动浏览器和登录流程（异步执行）
    this.performLogin(sessionId, username, password, xiunoBaseUrl).catch((error) => {
      this.logger.error(`登录失败: ${error.message}`);
      const sess = this.captchaSessions.get(sessionId);
      if (sess) {
        sess.status = 'failed';
        sess.error = error.message;
      }
    });

    return sessionId;
  }

  /**
   * 执行登录流程（私有方法）
   */
  private async performLogin(
    sessionId: string,
    username: string,
    password: string,
    xiunoBaseUrl: string,
  ): Promise<void> {
    const session = this.captchaSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // 启动浏览器（非无头模式，让用户可以看到）
      this.logger.log(`启动浏览器 - Session: ${sessionId}`);
      browser = await puppeteer.launch({
        headless: false, // 显示浏览器窗口
        slowMo: 30,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      page = await browser.newPage();
      session.browser = browser;
      session.page = page;

      // 设置视口
      await page.setViewport({ width: 1280, height: 900 });

      // 访问登录页面
      const loginUrl = `${xiunoBaseUrl}?user-login.htm`;
      this.logger.log(`访问登录页面: ${loginUrl}`);
      await page.goto(loginUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      await this.sleep(2000);

      // 填写用户名
      this.logger.log('填写登录信息...');
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      await page.click('input[name="email"]');
      await this.sleep(200);
      await page.type('input[name="email"]', username, { delay: 120 });

      // 填写密码
      await page.click('input[name="password"]');
      await this.sleep(200);
      await page.type('input[name="password"]', password, { delay: 120 });

      await this.sleep(1000);

      // 处理 Geetest 滑块验证码
      this.logger.log('========== 开始处理验证码 ==========');
      await this.handleGeetestCaptcha(page);

      // 等待验证完成
      await this.sleep(2000);

      // 点击登录按钮
      this.logger.log('点击登录按钮...');
      await this.clickLoginButton(page);

      // 等待登录完成
      await this.sleep(3000);

      // 检查是否登录成功
      const currentUrl = page.url();
      this.logger.log(`登录后URL: ${currentUrl}`);

      if (!currentUrl.includes('user-login')) {
        this.logger.log(`✓ 登录成功 - Session: ${sessionId}`);
        
        // 获取 token（从 cookie 或 localStorage）
        const token = await this.extractToken(page);
        if (token) {
          this.loginTokens.set(username, token);
          this.logger.log(`Token 已保存 - Username: ${username}`);
        }

        session.status = 'completed';
      } else {
        throw new Error('登录失败，仍在登录页面');
      }

    } catch (error) {
      this.logger.error(`登录过程出错: ${error.message}`);
      session.status = 'failed';
      session.error = error.message;
      throw error;
    } finally {
      // 关闭浏览器
      if (browser) {
        await this.sleep(2000); // 给用户一点时间看结果
        await browser.close();
        this.logger.log(`浏览器已关闭 - Session: ${sessionId}`);
      }
    }
  }

  /**
   * 处理 Geetest 验证码的完整流程（基于 test.js 实现）
   */
  private async handleGeetestCaptcha(page: Page): Promise<void> {
    try {
      // 步骤1: 找到并点击验证触发按钮
      this.logger.log('[步骤1] 查找验证触发区域...');
      
      await this.sleep(1000);
      
      let clicked = false;
      const selectors = [
        '.geetest_radar_tip',
        '.geetest_holder',
        'div[class*="geetest"]',
        'div[class*="captcha"]'
      ];
      
      for (const selector of selectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            this.logger.log(`找到验证元素: ${selector} (${elements.length}个)`);
            for (const el of elements) {
              const box = await el.boundingBox();
              if (box && box.width > 0 && box.height > 0) {
                this.logger.log(`点击验证触发区域: ${selector}`);
                await el.click();
                clicked = true;
                await this.sleep(2000);
                break;
              }
            }
            if (clicked) break;
          }
        } catch (e) {
          // 继续尝试下一个
        }
      }

      if (!clicked) {
        this.logger.log('未找到验证触发按钮，尝试直接查找滑块...');
      }

      // 步骤2: 等待滑块出现
      this.logger.log('[步骤2] 等待滑块弹窗加载...');
      await this.sleep(2000);

      // 步骤3: 查找滑块按钮
      this.logger.log('[步骤3] 查找滑块按钮...');
      const sliderInfo = await this.findSliderButton(page);
      
      if (!sliderInfo) {
        throw new Error('未找到滑块按钮');
      }

      this.logger.log(`✓ 找到滑块: 位置(${Math.round(sliderInfo.x)}, ${Math.round(sliderInfo.y)})`);
      this.logger.log(`  尺寸: ${Math.round(sliderInfo.width)}x${Math.round(sliderInfo.height)}`);

      // 步骤4: 获取滑动距离
      const distance = await this.calculateSlideDistance(page, sliderInfo);
      this.logger.log(`[步骤4] 最终滑动距离: ${Math.round(distance)}px`);

      // 步骤5: 执行滑动
      this.logger.log('[步骤5] 开始滑动...');
      
      try {
        await page.screenshot({ path: 'captcha_before_slide.png' });
        this.logger.log('📸 滑动前截图已保存');
      } catch (e) {
        // 忽略截图错误
      }
      
      await this.performSlide(page, sliderInfo, distance);

      this.logger.log('✓ 滑动完成');
      await this.sleep(1000);
      
      try {
        await page.screenshot({ path: 'captcha_after_slide.png' });
        this.logger.log('📸 滑动后截图已保存');
      } catch (e) {
        // 忽略截图错误
      }
      
      await this.sleep(1000);

      // 检查验证结果
      const success = await page.evaluate(() => {
        const successElements = document.querySelectorAll('.geetest_success_radar_tip, .geetest_success');
        return successElements.length > 0;
      });

      if (success) {
        this.logger.log('✓ 验证成功！');
      } else {
        this.logger.warn('⚠ 验证可能失败，请手动完成（预留30秒）...');
        await this.sleep(30000);
      }

    } catch (error) {
      this.logger.error('处理验证码时出错:', error.message);
      this.logger.log('请手动完成验证（预留30秒）...');
      await this.sleep(30000);
    }
  }

  /**
   * 查找滑块按钮
   */
  private async findSliderButton(page: Page): Promise<any> {
    const selectors = [
      '.geetest_btn',
      '.geetest_slider_button',
      'div[class*="slider_button"]',
      'div[class*="btn"]'
    ];

    // 尝试在主页面查找
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await this.sleep(500);
          
          let box = null;
          for (let i = 0; i < 5; i++) {
            box = await element.boundingBox();
            if (box) break;
            await this.sleep(300);
          }
          
          if (box && box.width > 0 && box.height > 0) {
            this.logger.log(`✓ 在主页面找到滑块: ${selector}`);
            return box;
          }
        }
      } catch (e) {
        // 继续
      }
    }

    // 尝试在 iframe 中查找
    this.logger.log('在主页面未找到，尝试在 iframe 中查找...');
    const frames = page.frames();
    this.logger.log(`共有 ${frames.length} 个 frame`);

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      for (const selector of selectors) {
        try {
          const element = await frame.$(selector);
          if (element) {
            await this.sleep(500);
            const box = await element.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
              this.logger.log(`✓ 在 iframe[${i}] 中找到滑块: ${selector}`);
              return box;
            }
          }
        } catch (e) {
          // 继续
        }
      }
    }

    return null;
  }

  /**
   * 计算滑动距离 - 通过检测缺口位置
   */
  private async calculateSlideDistance(page: Page, sliderBox: any): Promise<number> {
    this.logger.log('尝试检测缺口位置...');
    
    try {
      // 方法1: 通过 Canvas 图像识别检测缺口位置
      const gapPosition = await page.evaluate(() => {
        try {
          const canvasSelectors = [
            '.geetest_canvas_bg canvas',
            '.geetest_canvas_fullbg canvas',
            'canvas[class*="bg"]'
          ];
          
          let bgCanvas: any = null;
          for (const sel of canvasSelectors) {
            bgCanvas = document.querySelector(sel);
            if (bgCanvas) break;
          }
          
          if (!bgCanvas) {
            console.log('未找到背景 canvas');
            return null;
          }
          
          const ctx = bgCanvas.getContext('2d');
          const width = bgCanvas.width;
          const height = bgCanvas.height;
          
          if (width === 0 || height === 0) {
            console.log('Canvas 尺寸为 0');
            return null;
          }
          
          console.log(`Canvas 尺寸: ${width}x${height}`);
          
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          const middleY = Math.floor(height / 2);
          let gapX = 0;
          let maxEdge = 0;
          
          for (let x = 50; x < width - 50; x++) {
            let edgeStrength = 0;
            
            for (let y = Math.max(0, middleY - 20); y < Math.min(height, middleY + 20); y++) {
              const idx = (y * width + x) * 4;
              const prevIdx = (y * width + x - 1) * 4;
              
              const diff = Math.abs(data[idx] - data[prevIdx]) +
                          Math.abs(data[idx + 1] - data[prevIdx + 1]) +
                          Math.abs(data[idx + 2] - data[prevIdx + 2]);
              
              edgeStrength += diff;
            }
            
            if (edgeStrength > maxEdge) {
              maxEdge = edgeStrength;
              gapX = x;
            }
          }
          
          if (gapX > 0 && maxEdge > 1000) {
            console.log(`检测到缺口位置: X=${gapX}, 边缘强度=${maxEdge}`);
            return {
              x: gapX,
              canvasWidth: width,
              method: 'canvas_edge_detection'
            };
          }
          
          return null;
        } catch (e) {
          console.error('Canvas 分析失败:', e.message);
          return null;
        }
      });

      if (gapPosition && gapPosition.x > 0) {
        const distance = gapPosition.x - 30;
        this.logger.log(`✓ Canvas 边缘检测`);
        this.logger.log(`  缺口位置: ${gapPosition.x}px`);
        this.logger.log(`  滑动距离: ${Math.round(distance)}px`);
        return Math.max(distance, 50);
      }

    } catch (e) {
      this.logger.warn('自动检测失败:', e.message);
    }

    // 降级方案 - 随机距离
    this.logger.log('⚠ 无法检测缺口位置，使用智能估算');
    const minDistance = 80;
    const maxDistance = 220;
    const randomDistance = Math.floor(Math.random() * (maxDistance - minDistance) + minDistance);
    this.logger.log(`  使用随机距离: ${randomDistance}px`);
    
    return randomDistance;
  }

  /**
   * 执行滑动操作
   */
  private async performSlide(page: Page, sliderBox: any, distance: number): Promise<void> {
    const startX = sliderBox.x + sliderBox.width / 2;
    const startY = sliderBox.y + sliderBox.height / 2;

    this.logger.log(`起点: (${Math.round(startX)}, ${Math.round(startY)})`);
    this.logger.log(`目标距离: ${distance}px`);

    // 移动到滑块中心
    await page.mouse.move(startX, startY, { steps: 5 });
    await this.sleep(300);

    // 按下鼠标
    await page.mouse.down();
    await this.sleep(200);

    // 生成人类滑动轨迹
    const track = this.generateHumanTrack(distance);
    this.logger.log(`生成 ${track.length} 步滑动轨迹`);

    let currentX = startX;
    let currentY = startY;

    // 执行滑动
    for (let i = 0; i < track.length; i++) {
      const step = track[i];
      currentX += step;
      // 添加垂直抖动
      currentY = startY + (Math.random() - 0.5) * 5;
      
      await page.mouse.move(currentX, currentY, { steps: 1 });
      
      const delay = Math.random() * 15 + 8;
      await this.sleep(delay);

      if (i % 10 === 0 || i === track.length - 1) {
        const progress = Math.round((i / track.length) * 100);
        this.logger.log(`进度: ${progress}% | 当前位置: ${Math.round(currentX - startX)}px`);
      }
    }

    // 稍微超过目标，然后回退
    await page.mouse.move(currentX + 3, currentY, { steps: 2 });
    await this.sleep(100);
    await page.mouse.move(currentX - 1, startY, { steps: 2 });
    await this.sleep(150);

    // 释放鼠标
    await page.mouse.up();
    
    const finalDistance = Math.round(currentX - startX);
    this.logger.log(`✓ 滑动完成: 实际移动 ${finalDistance}px`);
  }

  /**
   * 生成人类滑动轨迹
   */
  private generateHumanTrack(distance: number): number[] {
    const track: number[] = [];
    let current = 0;
    
    // 阶段1: 加速阶段（30%的距离）
    const accelerateDistance = distance * 0.3;
    while (current < accelerateDistance) {
      const move = Math.random() * 4 + 3; // 3-7px
      track.push(move);
      current += move;
    }
    
    // 阶段2: 匀速阶段（50%的距离）
    const uniformDistance = distance * 0.8;
    while (current < uniformDistance) {
      const move = Math.random() * 3 + 5; // 5-8px
      track.push(move);
      current += move;
    }
    
    // 阶段3: 减速阶段（剩余距离）
    while (current < distance) {
      const move = Math.random() * 2 + 1; // 1-3px
      track.push(move);
      current += move;
    }
    
    return track;
  }

  /**
   * 点击登录按钮
   */
  private async clickLoginButton(page: Page): Promise<void> {
    try {
      // 方法1: 通过按钮文字查找
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.trim() === '登录') {
          this.logger.log('通过文字找到登录按钮');
          await btn.click();
          return;
        }
      }

      // 方法2: 通过 type="submit" 查找
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        this.logger.log('通过 type=submit 找到登录按钮');
        await submitBtn.click();
        return;
      }

      // 方法3: 通过表单提交
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.submit();
      });
      this.logger.log('通过表单提交');
    } catch (error) {
      this.logger.error('点击登录按钮失败:', error.message);
      throw error;
    }
  }

  /**
   * 从页面提取 token
   */
  private async extractToken(page: Page): Promise<string | null> {
    try {
      // 方法1: 从 Cookie 获取
      const cookies = await page.cookies();
      const authCookie = cookies.find(
        (c) => c.name === 'auth_key' || c.name === 'token' || c.name === 'user_token',
      );
      
      if (authCookie) {
        this.logger.log(`从 Cookie 获取 token: ${authCookie.name}`);
        return authCookie.value;
      }

      // 方法2: 从 localStorage 获取
      const localStorageToken = await page.evaluate(() => {
        return localStorage.getItem('token') || localStorage.getItem('auth_token');
      });

      if (localStorageToken) {
        this.logger.log('从 localStorage 获取 token');
        return localStorageToken;
      }

      this.logger.warn('未找到 token');
      return null;
    } catch (error) {
      this.logger.error(`提取 token 失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 检查验证码会话状态
   */
  getCaptchaSessionStatus(sessionId: string): CaptchaSession | undefined {
    return this.captchaSessions.get(sessionId);
  }

  /**
   * 使用 token 发帖到 Xiuno
   */
  async createPost(
    username: string,
    postData: {
      title: string;
      content: string;
      board: string;
    },
    xiunoBaseUrl: string,
  ): Promise<{ success: boolean; message: string; postId?: string }> {
    const token = this.getToken(username);
    
    if (!token) {
      return {
        success: false,
        message: '未登录，需要先完成登录验证',
      };
    }

    try {
      // 这里需要根据实际的 Xiuno API 调整
      // 示例：使用 axios 调用 API
      const axios = require('axios');
      
      const response = await axios.post(
        `${xiunoBaseUrl}?thread-create.htm`,
        {
          fid: postData.board, // 板块ID
          subject: postData.title,
          message: postData.content,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: `auth_key=${token}`, // 根据实际 cookie 名称调整
          },
        },
      );

      if (response.data && response.data.error === 0) {
        return {
          success: true,
          message: '发帖成功',
          postId: response.data.tid || response.data.thread_id,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || '发帖失败',
        };
      }
    } catch (error) {
      this.logger.error(`发帖失败: ${error.message}`);
      return {
        success: false,
        message: `发帖失败: ${error.message}`,
      };
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 辅助函数：sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理过期的会话（可选，定时调用）
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const expireTime = 10 * 60 * 1000; // 10分钟

    for (const [sessionId, session] of this.captchaSessions.entries()) {
      // 简单的过期检查（可以添加创建时间字段）
      if (session.status !== 'pending') {
        this.captchaSessions.delete(sessionId);
        this.logger.log(`清理会话: ${sessionId}`);
      }
    }
  }
}
