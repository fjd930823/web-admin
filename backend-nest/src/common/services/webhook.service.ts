import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export enum WebhookType {
  DINGTALK = 'dingtalk',
  WECOM = 'wecom',
  FEISHU = 'feishu',
  CUSTOM = 'custom',
}

export interface WebhookMessage {
  title?: string;
  content: string;
  mentionedList?: string[];
  mentionedMobileList?: string[];
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * 发送 Webhook 消息
   * @param webhookUrl Webhook URL
   * @param message 消息内容
   * @param type Webhook 类型
   */
  async send(
    webhookUrl: string,
    message: WebhookMessage,
    type: WebhookType = WebhookType.CUSTOM,
  ): Promise<boolean> {
    try {
      const payload = this.buildPayload(message, type);
      
      const response = await firstValueFrom(
        this.httpService.post(webhookUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      this.logger.log(`Webhook sent successfully to ${type}: ${webhookUrl}`);
      return response.status === 200;
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
      return false;
    }
  }

  /**
   * 发送钉钉消息
   */
  async sendDingTalk(webhookUrl: string, message: WebhookMessage): Promise<boolean> {
    return this.send(webhookUrl, message, WebhookType.DINGTALK);
  }

  /**
   * 发送企业微信消息
   */
  async sendWecom(webhookUrl: string, message: WebhookMessage): Promise<boolean> {
    return this.send(webhookUrl, message, WebhookType.WECOM);
  }

  /**
   * 发送飞书消息
   */
  async sendFeishu(webhookUrl: string, message: WebhookMessage): Promise<boolean> {
    return this.send(webhookUrl, message, WebhookType.FEISHU);
  }

  /**
   * 构建不同平台的消息格式
   */
  private buildPayload(message: WebhookMessage, type: WebhookType): any {
    switch (type) {
      case WebhookType.DINGTALK:
        return this.buildDingTalkPayload(message);
      case WebhookType.WECOM:
        return this.buildWecomPayload(message);
      case WebhookType.FEISHU:
        return this.buildFeishuPayload(message);
      default:
        return this.buildCustomPayload(message);
    }
  }

  /**
   * 钉钉消息格式
   */
  private buildDingTalkPayload(message: WebhookMessage): any {
    const payload: any = {
      msgtype: 'markdown',
      markdown: {
        title: message.title || '通知',
        text: message.content,
      },
    };

    if (message.mentionedMobileList?.length) {
      payload.at = {
        atMobiles: message.mentionedMobileList,
        isAtAll: false,
      };
    }

    return payload;
  }

  /**
   * 企业微信消息格式
   */
  private buildWecomPayload(message: WebhookMessage): any {
    return {
      msgtype: 'markdown',
      markdown: {
        content: message.content,
      },
    };
  }

  /**
   * 飞书消息格式
   */
  private buildFeishuPayload(message: WebhookMessage): any {
    return {
      msg_type: 'text',
      content: {
        text: message.content,
      },
    };
  }

  /**
   * 自定义消息格式
   */
  private buildCustomPayload(message: WebhookMessage): any {
    return {
      title: message.title,
      content: message.content,
      mentionedList: message.mentionedList,
      mentionedMobileList: message.mentionedMobileList,
    };
  }

  /**
   * 格式化 Markdown 消息
   */
  formatMarkdown(data: {
    title: string;
    items: Array<{ label: string; value: string }>;
    footer?: string;
  }): string {
    let markdown = `### ${data.title}\n\n`;
    
    data.items.forEach(item => {
      markdown += `**${item.label}**: ${item.value}\n\n`;
    });

    if (data.footer) {
      markdown += `\n---\n${data.footer}`;
    }

    return markdown;
  }
}