import { Injectable, Logger } from '@nestjs/common';
import { CloudAccount } from './cloud-community.service';
// Puppeteer will be dynamically imported to handle installation issues
// Puppeteer 模版，以备不时之需
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  
  async solveCaptcha(account: CloudAccount): Promise<any> {
    let puppeteer;
    try {
      puppeteer = await import('puppeteer');
    } catch (error) {
      this.logger.warn('Puppeteer not installed, using mock captcha solver');
      return await this.mockCaptcha();
    }
    
    const browser = await puppeteer.launch({ 
      headless: true, // 在生产环境中设为true
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    try {
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');
      
      await page.goto('https://123panfx.com/?user-login.htm', {
        waitUntil: 'networkidle2',
      });
      
      await page.waitForSelector('#captcha-element', { timeout: 10000 }).catch(() => {
        this.logger.log('未检测到滑块验证元素，可能不需要验证');
        return;
      });
      
      const captchaData = await page.evaluate(() => {
        return {
          lot_number: (window as any).lot_number || '',
          captcha_output: (window as any).captcha_output || '',
          pass_token: (window as any).pass_token || '',
          gen_time: (window as any).gen_time || ''
        };
      });
      
      this.logger.log('滑块验证数据获取完成', captchaData);
      return captchaData;
      
    } catch (error) {
      this.logger.error(`处理滑块验证失败: ${error.message}`);
      // 如果无法处理滑块验证，返回空数据让系统尝试无验证登录
      return {
        lot_number: '',
        captcha_output: '',
        pass_token: '',
        gen_time: ''
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * 模拟滑块验证
   */
  async mockCaptcha(): Promise<any> {
    this.logger.log('使用模拟滑块验证数据');
    
    return {
      lot_number: Date.now().toString(),
      captcha_output: 'mock_captcha_output',
      pass_token: 'mock_pass_token',
      gen_time: Math.floor(Date.now() / 1000).toString()
    };
  }
}