import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TokenConfig {
  phone: string;
  bbs_token: string;
  expires?: string;
}

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private readonly configPath = path.join(
    process.cwd(),
    'xiuno-tokens.conf',
  );

  /**
   * 解析 token 配置文件
   */
  private parseTokenFile(content: string): TokenConfig[] {
    const tokens: TokenConfig[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      // 跳过注释和空行
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      try {
        // 格式：phone=bbs_token=xxx,expires=xxx
        const [phone, ...rest] = trimmedLine.split('=');
        const params = rest.join('='); // 处理 token 中可能包含 =

        const config: TokenConfig = { phone: phone.trim(), bbs_token: '' };

        // 解析参数
        const parts = params.split(',');
        for (const part of parts) {
          const [key, value] = part.split('=');
          if (key === 'bbs_token') {
            config.bbs_token = value;
          } else if (key === 'expires') {
            config.expires = value;
          }
        }

        if (config.bbs_token) {
          tokens.push(config);
        }
      } catch (error) {
        this.logger.warn(`解析配置行失败: ${line}`, error);
      }
    }

    return tokens;
  }

  /**
   * 生成 token 配置文件内容
   */
  private generateTokenFileContent(tokens: TokenConfig[]): string {
    const header = `# Xiuno Token 配置文件
# 格式：手机号=bbs_token=xxx,expires=ISO时间（可选）
# 
# 如何获取 token：
# 1. 在浏览器中登录 Xiuno 论坛
# 2. 按 F12 打开开发者工具
# 3. 切换到 Application（应用）标签 -> Cookies
# 4. 找到 bbs_token 的值，复制
# 5. （可选）如果有 expires 字段，也一并复制
#
# 配置格式示例：
# 方式1：带过期时间（推荐）
# 312653114@qq.com=bbs_token=BrMosTGiZCMhCDKozscSMprkD8tyi0fZXASjjzIN1iB8D5dL,expires=2026-04-29T01:38:58.528Z
#
# 方式2：不带过期时间
# 13800138000=bbs_token=abc123def456xyz789
#
# 可以混合使用：
# user@example.com=bbs_token=ghi789jkl012mno345,expires=2026-03-20T00:00:00.000Z

# 在下面添加你的账号配置：
`;

    const lines = tokens.map((token) => {
      let line = `${token.phone}=bbs_token=${token.bbs_token}`;
      if (token.expires) {
        line += `,expires=${token.expires}`;
      }
      return line;
    });

    return header + lines.join('\n') + '\n\n';
  }

  /**
   * 获取所有 token 配置
   */
  async getAllTokens(): Promise<TokenConfig[]> {
    try {
      if (!fs.existsSync(this.configPath)) {
        this.logger.warn(`配置文件不存在: ${this.configPath}`);
        return [];
      }

      const content = fs.readFileSync(this.configPath, 'utf-8');
      return this.parseTokenFile(content);
    } catch (error) {
      this.logger.error('读取 token 配置失败', error);
      throw new Error('读取 token 配置失败');
    }
  }

  /**
   * 添加或更新 token
   */
  async upsertToken(tokenConfig: TokenConfig): Promise<void> {
    try {
      const tokens = await this.getAllTokens();
      const existingIndex = tokens.findIndex((t) => t.phone === tokenConfig.phone);

      if (existingIndex >= 0) {
        // 更新现有 token
        tokens[existingIndex] = tokenConfig;
      } else {
        // 添加新 token
        tokens.push(tokenConfig);
      }

      const content = this.generateTokenFileContent(tokens);
      fs.writeFileSync(this.configPath, content, 'utf-8');
      this.logger.log(`Token 配置已更新: ${tokenConfig.phone}`);
    } catch (error) {
      this.logger.error('更新 token 配置失败', error);
      throw new Error('更新 token 配置失败');
    }
  }

  /**
   * 删除 token
   */
  async deleteToken(phone: string): Promise<void> {
    try {
      const tokens = await this.getAllTokens();
      const filtered = tokens.filter((t) => t.phone !== phone);

      if (filtered.length === tokens.length) {
        throw new Error(`未找到手机号为 ${phone} 的配置`);
      }

      const content = this.generateTokenFileContent(filtered);
      fs.writeFileSync(this.configPath, content, 'utf-8');
      this.logger.log(`Token 配置已删除: ${phone}`);
    } catch (error) {
      this.logger.error('删除 token 配置失败', error);
      throw error;
    }
  }

  /**
   * 批量更新 tokens
   */
  async batchUpdateTokens(tokens: TokenConfig[]): Promise<void> {
    try {
      const content = this.generateTokenFileContent(tokens);
      fs.writeFileSync(this.configPath, content, 'utf-8');
      this.logger.log(`批量更新 ${tokens.length} 个 token 配置`);
    } catch (error) {
      this.logger.error('批量更新 token 配置失败', error);
      throw new Error('批量更新 token 配置失败');
    }
  }
}
