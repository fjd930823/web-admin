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

### 方式一：一键部署脚本（最简单）⭐

适合快速部署，自动完成所有步骤。

#### 前置条件

1. 已安装MySQL并创建数据库（使用宝塔或命令行）
2. 已配置 `backend-nest/.env` 文件

#### 部署步骤

```bash
# 1. 给脚本执行权限
chmod +x deploy.sh

# 2. 运行部署脚本
./deploy.sh
```

脚本会自动完成：
- ✅ 检查环境（Node.js、npm、PM2）
- ✅ 安装依赖
- ✅ 构建前后端
- ✅ 启动服务
- ✅ 显示访问地址

部署完成后直接访问 http://localhost:8000

---

### 方式二：宝塔面板部署（图形化）

适合使用宝塔面板的用户，图形化操作更简单。

#### 1. 创建数据库



#### 2. 配置环境变量

编辑 `backend-nest/.env` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=merge_request              # 宝塔创建的用户名
DB_PASSWORD=你设置的密码      # 宝塔创建数据库时设置的密码
DB_NAME=merge_request

# JWT配置（请修改为随机字符串）
JWT_SECRET=your-secret-key-change-in-production

# 服务端口
PORT=7001
```

#### 3. 安装后端依赖

```bash
cd backend-nest
npm install --registry=https://registry.npmmirror.com/ --legacy-peer-deps
```

#### 4. 启动后端服务

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

# 或者使用Nginx部署（推荐）
# 将 frontend/dist 目录配置到Nginx
```

#### 7. 配置Nginx（可选，推荐生产环境）

**使用Nginx的优势：**
- ✅ 更好的性能和缓存
- ✅ 统一的访问入口（前后端同域名，避免跨域）
- ✅ 支持HTTPS
- ✅ 静态资源优化

**快速配置（宝塔面板）：**

1. 创建网站，根目录指向 `frontend/dist`
2. 在网站配置中添加API代理：

```nginx
location /api {
    proxy_pass http://127.0.0.1:7001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

**详细配置指南：** 查看 [NGINX_CONFIG.md](./NGINX_CONFIG.md)

**不使用Nginx：**

PM2已经启动了前端服务，可以直接访问：
- 前端：http://localhost:8000
- 后端：http://localhost:7001

### 方式三：手动部署（完全控制）

使用PM2配置文件手动部署前后端。

#### 1. 创建数据库

在宝塔面板创建数据库（参考方式一），或使用命令行：

```bash
chmod +x init-mysql.sh
./init-mysql.sh
```

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

### 方式四：Docker部署（可选）

如果服务器网络环境允许访问Docker镜像源：

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

**注意：** 国内服务器可能无法访问Docker镜像源，推荐使用方式一或方式二。

## 访问地址

部署成功后，访问以下地址：

- **前端界面：** http://localhost:8000
- **后端API：** http://localhost:7001
- **API文档：** http://localhost:7001/api

## 默认账号

首次启动会自动创建管理员账号：

- 用户名：`admin`
- 密码：`admin123`

**⚠️ 重要：首次登录后请立即修改密码！**

## 功能说明

### 用户管理
- 用户注册/登录
- 角色权限管理（管理员/开发者/测试人员）
- 修改密码
- 用户列表管理

### 任务管理
- 创建任务
- 任务看板（待处理/进行中/已完成）
- 任务分配
- 任务状态更新

### 合并请求管理
- 创建合并请求
- 审核流程
- 状态跟踪
- Webhook通知（支持钉钉、企业微信、飞书）

### Webhook通知
支持多种机器人平台：
- 钉钉机器人
- 企业微信机器人
- 飞书机器人
- 自定义Webhook

## 常见问题

### Q1: npm安装依赖失败？

**解决方案：**
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install --registry=https://registry.npmmirror.com/ --legacy-peer-deps
```

### Q2: 数据库连接失败？

**检查清单：**
1. MySQL服务是否启动：`systemctl status mysqld`
2. 数据库是否创建：`mysql -u root -p -e "show databases;"`
3. .env文件中的密码是否正确
4. 用户名是否正确（宝塔用户应该是 `merge_request`，不是 `root`）

### Q3: 端口被占用？

**解决方案：**
```bash
# 查看端口占用
lsof -i :7001
lsof -i :8000

# 修改.env中的PORT配置
# 或杀死占用端口的进程
kill -9 <PID>
```

### Q4: 前端无法连接后端？

**检查：**
1. 后端是否正常启动
2. 前端配置的API地址是否正确
3. 防火墙是否开放端口
4. 如果使用反向代理，检查Nginx配置

### Q5: PM2启动失败？

**解决方案：**
```bash
# 安装PM2
npm install -g pm2

# 查看PM2日志
pm2 logs

# 重启服务
pm2 restart all

# 删除所有进程重新启动
pm2 delete all
pm2 start dist/main.js --name merge-backend
```

## 生产环境建议

### 安全配置

1. **修改JWT密钥：**
   ```bash
   # 生成随机密钥
   openssl rand -base64 32
   # 将生成的密钥填入.env的JWT_SECRET
   ```

2. **修改默认管理员密码**

3. **配置HTTPS：**
   - 在宝塔面板申请SSL证书
   - 或使用Let's Encrypt免费证书

4. **配置防火墙：**
   ```bash
   # 只开放必要端口
   firewall-cmd --permanent --add-port=80/tcp
   firewall-cmd --permanent --add-port=443/tcp
   firewall-cmd --reload
   ```

### 性能优化

1. **启用Gzip压缩**（Nginx配置）
2. **配置静态资源缓存**
3. **使用CDN加速静态资源**
4. **定期备份数据库：**
   ```bash
   # 手动备份
   mysqldump -u merge_request -p merge_request > backup_$(date +%Y%m%d).sql
   
   # 或使用宝塔面板的定时备份功能
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

## 许可证

MIT License
