# 云盘社区管理模块

此模块提供自动化管理123云盘社区的功能，包括账号管理、自动登录、发帖和删除帖子。

## 功能特性

- 多账号管理：支持添加和管理多个云盘账号
- 自动登录：自动处理登录流程，包括滑块验证
- 批量发帖：支持使用不同账号发布帖子
- 帖子管理：提供删除帖子功能
- 记录保存：自动保存发布的帖子记录

## API 接口

### 账号管理

#### 创建云盘账号
```
POST /api/cloud-community/accounts
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "your_password",
  "is_active": true
}
```

#### 获取所有云盘账号
```
GET /api/cloud-community/accounts
```

### 登录管理

#### 登录到云盘社区
```
POST /api/cloud-community/login/:accountId
```

### 帖子管理

#### 发布帖子到云盘社区
```
POST /api/cloud-community/posts
Content-Type: application/json

{
  "title": "帖子标题",
  "content": "帖子内容",
  "category": "分类ID",
  "account_id": 1
}
```

#### 删除云盘社区的帖子
```
DELETE /api/cloud-community/posts/:postId/account/:accountId
```

#### 获取所有帖子记录
```
GET /api/cloud-community/posts
```

#### 根据账号获取帖子记录
```
GET /api/cloud-community/posts/account/:accountId
```

## 使用示例

### 1. 添加账号
首先添加要管理的云盘账号：

```bash
curl -X POST http://localhost:7001/api/cloud-community/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "username": "your_username",
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

### 2. 登录账号
登录指定账号到云盘社区：

```bash
curl -X POST http://localhost:7001/api/cloud-community/login/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. 发布帖子
使用指定账号发布帖子：

```bash
curl -X POST http://localhost:7001/api/cloud-community/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "自动化发布的帖子",
    "content": "这是通过API自动发布的帖子内容",
    "category": "43",
    "account_id": 1
  }'
```

### 4. 删除帖子
删除指定账号发布的帖子：

```bash
curl -X DELETE http://localhost:7001/api/cloud-community/posts/POST_ID/account/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 滑块验证处理

系统集成了滑块验证处理功能：

- 自动检测是否需要滑块验证
- 使用Puppeteer模拟浏览器操作完成验证
- 如果自动验证失败，使用模拟数据进行登录尝试

## 数据库结构

### cloud_accounts 表
- id: 主键
- username: 用户名
- email: 邮箱
- password: 加密后的密码
- captcha_token: 验证码token
- session_id: 会话ID
- is_active: 账号是否激活
- last_login_at: 最后登录时间
- created_at: 创建时间
- updated_at: 更新时间

### cloud_posts 表
- id: 主键
- account_id: 关联账号ID
- post_id: 社区帖子ID
- title: 帖子标题
- content: 帖子内容
- category: 帖子分类
- status: 帖子状态 (published, deleted)
- published_at: 发布时间
- created_at: 创建时间
- updated_at: 更新时间

## 安全注意事项

- 密码使用MD5哈希存储（生产环境中建议使用更安全的哈希算法）
- 所有API端点都需要JWT认证
- 会话信息妥善管理，避免信息泄露
- 定期清理过期的会话信息

## 错误处理

- 网络请求失败时会返回相应的错误信息
- 登录失败会返回具体失败原因
- 发帖或删除操作失败会返回错误详情

## 部署说明

1. 确保已运行数据库迁移
2. 安装puppeteer依赖（用于滑块验证）
3. 配置正确的环境变量
4. 启动服务后即可使用API

## 注意事项

- 请遵守123云盘社区的使用条款
- 避免过于频繁的操作以防止账号被封禁
- 定期检查账号状态和会话有效性
- 妥善保管账号信息，避免泄露

## 技术栈

- NestJS: 服务端框架
- SQLite: 数据库
- Knex: SQL查询构建器
- Puppeteer: 浏览器自动化
- Axios: HTTP客户端
