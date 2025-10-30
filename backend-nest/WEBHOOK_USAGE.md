# Webhook 使用指南

## 功能说明

通用的 Webhook 服务，支持发送消息到各种机器人平台。

## 支持的平台

- 钉钉机器人
- 企业微信机器人
- 飞书机器人
- 自定义 Webhook

## 使用方法

### 1. 在任何服务中注入 WebhookService

```typescript
import { Injectable } from '@nestjs/common';
import { WebhookService } from '../common/services/webhook.service';

@Injectable()
export class YourService {
  constructor(private readonly webhookService: WebhookService) {}

  async someMethod() {
    // 使用 webhook
  }
}
```

### 2. 发送钉钉消息

```typescript
await this.webhookService.sendDingTalk(
  'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN',
  {
    title: '任务提醒',
    content: '### 新任务创建\n\n**任务名称**: 修复登录bug\n\n**负责人**: 张三',
    mentionedMobileList: ['13800138000'], // @某人
  }
);
```

### 3. 发送企业微信消息

```typescript
await this.webhookService.sendWecom(
  'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY',
  {
    content: '### 合并请求通知\n\n**标题**: 新功能开发\n\n**状态**: 已合并',
  }
);
```

### 4. 发送飞书消息

```typescript
await this.webhookService.sendFeishu(
  'https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_TOKEN',
  {
    content: '新的合并请求等待审核',
  }
);
```

### 5. 使用 Markdown 格式化工具

```typescript
const message = this.webhookService.formatMarkdown({
  title: '任务状态变更',
  items: [
    { label: '任务名称', value: task.title },
    { label: '状态', value: '已完成' },
    { label: '负责人', value: task.assignee_name },
    { label: '完成时间', value: new Date().toLocaleString() },
  ],
  footer: '点击查看详情: http://your-domain.com/tasks/123',
});

await this.webhookService.sendDingTalk(webhookUrl, {
  title: '任务通知',
  content: message,
});
```

## 实际应用示例

### 示例1: 任务创建时发送通知

```typescript
// tasks.service.ts
import { WebhookService } from '../common/services/webhook.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task)
    private taskModel: typeof Task,
    private readonly webhookService: WebhookService,
  ) {}

  async create(createTaskDto: CreateTaskDto, creatorId: number) {
    const task = await this.taskModel.create({
      ...createTaskDto,
      creator_id: creatorId,
    });

    // 发送 Webhook 通知
    const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
    if (webhookUrl) {
      const message = this.webhookService.formatMarkdown({
        title: '📋 新任务创建',
        items: [
          { label: '任务名称', value: task.title },
          { label: '优先级', value: task.priority },
          { label: '状态', value: task.status },
          { label: '创建时间', value: new Date().toLocaleString('zh-CN') },
        ],
        footer: `查看详情: ${process.env.FRONTEND_URL}/tasks/${task.id}`,
      });

      await this.webhookService.sendDingTalk(webhookUrl, {
        title: '新任务创建',
        content: message,
      });
    }

    return this.findOne(task.id);
  }
}
```

### 示例2: 合并请求状态变更通知

```typescript
// merge-requests.service.ts
async update(id: number, updateDto: UpdateMergeRequestDto, user: any) {
  const mergeRequest = await this.mergeRequestModel.findByPk(id);
  
  const oldStatus = mergeRequest.status;
  await mergeRequest.update(updateDto);
  
  // 如果状态改为已合并，发送通知
  if (updateDto.status === 'merged' && oldStatus !== 'merged') {
    const webhookUrl = process.env.WECOM_WEBHOOK_URL;
    if (webhookUrl) {
      const message = this.webhookService.formatMarkdown({
        title: '✅ 代码已合并',
        items: [
          { label: '合并链接', value: mergeRequest.merge_url },
          { label: '合并人', value: user.username },
          { label: '合并时间', value: new Date().toLocaleString('zh-CN') },
        ],
      });

      await this.webhookService.sendWecom(webhookUrl, {
        content: message,
      });
    }
  }

  return this.findOne(id);
}
```

### 示例3: 用户注册通知

```typescript
// auth.service.ts
async register(registerDto: RegisterDto) {
  const user = await this.userModel.create({
    username,
    email,
    password: hashedPassword,
  });

  // 发送新用户注册通知
  const webhookUrl = process.env.FEISHU_WEBHOOK_URL;
  if (webhookUrl) {
    await this.webhookService.sendFeishu(webhookUrl, {
      content: `🎉 新用户注册: ${user.username} (${user.email})`,
    });
  }

  return user;
}
```

## 环境变量配置

在 `.env` 文件中配置 Webhook URL：

```env
# 钉钉机器人
DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN

# 企业微信机器人
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY

# 飞书机器人
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_TOKEN

# 前端地址（用于生成链接）
FRONTEND_URL=http://localhost:8000
```

## 获取 Webhook URL

### 钉钉
1. 打开钉钉群聊
2. 群设置 → 智能群助手 → 添加机器人 → 自定义
3. 复制 Webhook 地址

### 企业微信
1. 打开企业微信群聊
2. 群设置 → 群机器人 → 添加机器人
3. 复制 Webhook 地址

### 飞书
1. 打开飞书群聊
2. 群设置 → 群机器人 → 添加机器人 → 自定义机器人
3. 复制 Webhook 地址

## 注意事项

1. Webhook URL 包含敏感信息，不要提交到代码仓库
2. 建议使用环境变量管理 Webhook URL
3. 发送失败不会抛出异常，只会记录日志
4. 注意各平台的消息频率限制
5. Markdown 格式在不同平台可能有差异

## 高级用法

### 批量发送

```typescript
const webhooks = [
  process.env.DINGTALK_WEBHOOK_URL,
  process.env.WECOM_WEBHOOK_URL,
];

await Promise.all(
  webhooks.filter(Boolean).map(url =>
    this.webhookService.send(url, message, WebhookType.DINGTALK)
  )
);
```

### 错误处理

```typescript
const success = await this.webhookService.sendDingTalk(webhookUrl, message);
if (!success) {
  this.logger.warn('Webhook 发送失败，但不影响主流程');
}
```