# 代码合并管理系统 - 部署文档

## 项目简介

一个基于 NestJS + Ant Design Pro 的代码合并管理系统，支持任务管理、合并请求管理、用户权限管理等功能。

## 技术栈

**后端：**
- NestJS 10.x
- MySQL 5.7+
- Sequelize ORM
- JWT 认证
- Swagger API文档

**前端：**
- React 18
- Ant Design Pro
- UmiJS 4.x
- TypeScript

## 环境要求

- Node.js 16.x 或更高版本
- MySQL 5.7 或更高版本
- npm 或 yarn 包管理器

## 快速开始

# JWT配置（请修改为随机字符串）
JWT_SECRET=your-secret-key-change-in-production

#### 1. 安装后端依赖

```bash
cd backend-nest
npm install --registry=https://registry.npmmirror.com/ --legacy-peer-deps
```

#### 2. 启动后端服务

**开发模式：**
```bash
npm run start:dev
```

**生产模式（使用PM2）：**
```bash
# 1. 构建后端
cd backend-nest
npm run build

# 2. 返回项目根目录
cd ..

# 3. 使用PM2配置文件启动（会自动加载.env）
pm2 start ecosystem.config.js

# 4. 查看状态
pm2 status

# 5. 查看日志
pm2 logs merge-backend

# 6. 保存配置（开机自启）
pm2 save
pm2 startup
```

**注意：** 必须在项目根目录使用 `pm2 start ecosystem.config.js` 启动，这样才能正确加载环境变量和配置。

#### 5. 安装前端依赖

```bash
cd frontend
npm install --registry=https://registry.npmmirror.com/ --legacy-peer-deps
```

#### 6. 启动前端服务

**开发模式：**
```bash
cd frontend
npm run dev
```

**生产模式（使用PM2）：**
```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 返回项目根目录
cd ..

# 3. 前端已包含在ecosystem.config.js中，直接启动即可
# 如果只启动前端：
pm2 start ecosystem.config.js --only merge-frontend



使用PM2配置文件手动部署前后端。

#### 1. 创建数据库

#### 2. 配置环境变量

编辑 `backend-nest/.env` 文件，填入数据库信息：
```bash
DB_USER=merge_request
DB_PASSWORD=你的数据库密码
DB_NAME=merge_request
```

#### 3. 安装依赖

```bash
# 安装后端依赖
cd backend-nest
npm install --registry=https://registry.npmmirror.com/ --legacy-peer-deps

# 安装前端依赖
cd ../frontend
npm install --registry=https://registry.npmmirror.com/ --legacy-peer-deps

# 返回根目录
cd ..
```

#### 4. 构建项目

```bash
# 构建后端
cd backend-nest
npm run build

# 构建前端
cd ../frontend
npm run build

# 返回根目录
cd ..
```

#### 5. 启动服务

```bash
# 安装PM2（如果没有）
npm install -g pm2

# 使用配置文件启动（会同时启动前后端）
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 保存配置（开机自启）
pm2 save
pm2 startup
```

#### 6. 管理服务

```bash
# 重启所有服务
pm2 restart all

# 重启单个服务
pm2 restart merge-backend
pm2 restart merge-frontend

# 停止服务
pm2 stop all

# 删除服务
pm2 delete all

# 查看详细信息
pm2 show merge-backend
```

### Webhook通知
支持多种机器人平台：
- 钉钉机器人
- 企业微信机器人
- 飞书机器人
- 自定义Webhook

## 生产环境建议

### 安全配置

1. **修改JWT密钥：**
   ```bash
   # 生成随机密钥
   openssl rand -base64 32
   # 将生成的密钥填入.env的JWT_SECRET
   ```



### 监控和日志

1. **查看PM2日志：**
   ```bash
   pm2 logs merge-backend
   pm2 logs merge-frontend
   ```

2. **查看系统资源：**
   ```bash
   pm2 monit
   ```

3. **配置日志轮转**（防止日志文件过大）

## 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 更新后端
cd backend-nest
npm install
npm run build
pm2 restart merge-backend

# 3. 更新前端
cd ../frontend
npm install
npm run build
pm2 restart merge-frontend
```

## 目录结构

```
.
├── backend-nest/          # 后端代码
│   ├── src/              # 源代码
│   ├── dist/             # 编译产物
│   ├── database/         # 数据库文件（SQLite模式）
│   ├── .env              # 环境配置
│   └── package.json
├── frontend/             # 前端代码
│   ├── src/             # 源代码
│   ├── dist/            # 构建产物
│   └── package.json
├── docker-compose.yml    # Docker配置
├── init-mysql.sh        # MySQL初始化脚本
└── README.md            # 本文档
```

## 技术支持

如遇到问题，请检查：
1. Node.js版本是否符合要求
2. MySQL服务是否正常运行
3. 端口是否被占用
4. 防火墙配置是否正确
5. 查看日志文件排查错误

