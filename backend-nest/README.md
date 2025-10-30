# 后端服务 - NestJS

## 安装依赖

```bash
npm install
```

## 启动开发服务器

```bash
npm run start:dev
```

服务将运行在 `http://localhost:7001`

## 默认账号

- 用户名: admin
- 密码: admin123

## API 端点

所有 API 都以 `/api` 为前缀：

### 认证
- POST `/api/auth/login` - 登录
- POST `/api/auth/register` - 注册
- GET `/api/auth/current` - 获取当前用户

### 用户管理
- GET `/api/users` - 获取用户列表
- POST `/api/users` - 创建用户
- PUT `/api/users/:id/role` - 修改用户角色
- PUT `/api/users/:id/password` - 重置密码
- DELETE `/api/users/:id` - 删除用户

### 任务
- GET `/api/tasks` - 获取任务列表
- GET `/api/tasks/:id` - 获取单个任务
- POST `/api/tasks` - 创建任务
- PUT `/api/tasks/:id` - 更新任务
- PUT `/api/tasks/:id/status` - 更新任务状态
- DELETE `/api/tasks/:id` - 删除任务

### 合并请求
- GET `/api/merge-requests` - 获取合并请求列表
- GET `/api/merge-requests/:id` - 获取单个合并请求
- POST `/api/merge-requests` - 创建合并请求
- PUT `/api/merge-requests/:id` - 更新合并请求
- DELETE `/api/merge-requests/:id` - 删除合并请求

## 数据库

使用 SQLite，数据库文件位于 `database/database.sqlite`

首次启动会自动创建表和默认管理员账号。

## 构建生产版本

```bash
npm run build
npm run start:prod
```