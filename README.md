# 代码合并管理系统

## 📋 项目简介

一个基于 **NestJS + Ant Design Pro** 的代码合并管理系统，支持任务管理、合并请求管理、用户权限管理、发帖管理等功能。

## ✨ 核心功能

- ✅ **用户管理** - 用户注册、登录、权限管理（管理员/普通用户）
- ✅ **任务管理** - 任务看板、状态流转、任务分配
- ✅ **合并请求** - MR 创建、审核、状态追踪
- ✅ **发帖管理** - 批量发帖、发帖记录、搜索功能
- ✅ **内容搜索** - 全局搜索功能（支持标题、内容搜索）
- ✅ **Webhook 通知** - 支持钉钉、企业微信、飞书等多种机器人

---

## 🛠️ 技术栈

### 后端
| 技术 | 版本 | 说明 |
|------|------|------|
| **NestJS** | 10.x | Node.js 后端框架 |
| **Knex** | 3.x | SQL 查询构建器 |
| **SQLite** | 3.x | 轻量级数据库 |
| **JWT** | - | 用户认证 |
| **TypeScript** | 5.x | 类型安全 |
| **bcryptjs** | - | 密码加密 |

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 18.x | UI 框架 |
| **Ant Design Pro** | 6.x | 企业级中后台框架 |
| **UmiJS** | 4.x | React 应用框架 |
| **TinyMCE** | 6.x | 富文本编辑器 |
| **TypeScript** | 5.x | 类型安全 |

---

## 📦 环境要求

- **Node.js**: 16.x 或更高版本
- **npm**: 8.x 或更高版本
- **操作系统**: macOS / Linux / Windows

> 💡 **提示**: 无需安装 MySQL，项目使用 SQLite 作为数据库。

---

## 🚀 快速开始

### 1. 安装后端依赖

```bash
cd backend-nest
npm install
```

### 2. 运行数据库迁移

```bash
# 创建数据库表
npm run migrate

# 创建默认管理员账号
npm run seed
```

### 3. 启动后端服务

**开发模式：**
```bash
npm run start:dev
```

**生产模式：**
```bash
npm run build
npm run start:prod
```

后端将运行在：`http://localhost:7001`

### 4. 安装前端依赖

```bash
cd ../frontend
npm install
```

### 5. 启动前端服务

**开发模式：**
```bash
npm run dev
```

**生产模式：**
```bash
npm run build
npm run serve
```

前端将运行在：`http://localhost:8000`

---

## 👤 默认管理员账号

```
用户名: admin
密码: admin123
```

> ⚠️ **安全提示**: 首次登录后请立即修改默认密码！

---

## 📁 项目结构

```
web-admin/
├── backend-nest/                # 后端代码
│   ├── src/
│   │   ├── auth/               # 认证模块
│   │   ├── users/              # 用户管理
│   │   ├── tasks/              # 任务管理
│   │   ├── merge-requests/     # 合并请求
│   │   ├── posts/              # 发帖管理 ✨ 新功能
│   │   ├── search/             # 搜索模块 ✨ 新功能
│   │   ├── common/             # 公共模块
│   │   └── database/           # 数据库配置
│   ├── database/
│   │   ├── migrations/         # 数据库迁移文件
│   │   ├── seeds/              # 初始数据
│   │   └── database.sqlite     # SQLite 数据库文件
│   ├── knexfile.ts             # Knex 配置
│   ├── .env                    # 环境变量（需要创建）
│   └── package.json
│
├── frontend/                   # 前端代码
│   ├── src/
│   │   ├── pages/
│   │   │   ├── User/          # 用户管理
│   │   │   ├── Task/          # 任务管理
│   │   │   ├── MergeRequest/  # 合并请求
│   │   │   └── Post/          # 发帖管理 ✨ 新功能
│   │   ├── services/          # API 服务
│   │   └── app.tsx
│   ├── public/
│   ├── .umirc.ts              # UmiJS 配置
│   └── package.json
│
├── ecosystem.config.js         # PM2 配置（生产环境）
└── README.md                   # 本文档
```

---

## 🔧 配置说明

### 后端环境变量

创建 `backend-nest/.env` 文件：

```bash
# 应用端口
PORT=7001

# JWT 密钥（请修改为随机字符串）
JWT_SECRET=your-secret-key-change-in-production

# Node 环境
NODE_ENV=development
```

### 生成安全的 JWT 密钥

```bash
# macOS/Linux
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📊 数据库管理

### Knex 迁移命令

```bash
cd backend-nest

# 查看迁移状态
npm run knex -- migrate:status

# 运行迁移（创建表）
npm run migrate

# 回滚迁移
npm run migrate:rollback

# 创建新迁移文件
npm run migrate:make migration_name

# 运行 seed（插入初始数据）
npm run seed
```

### 数据库备份

```bash
cd backend-nest

# 备份数据库
cp database/database.sqlite database/database.sqlite.backup.$(date +%Y%m%d)

# 恢复数据库
cp database/database.sqlite.backup.YYYYMMDD database/database.sqlite
```

### 查看数据库内容

```bash
cd backend-nest

# 进入 SQLite 命令行
sqlite3 database/database.sqlite

# 常用命令
.tables              # 查看所有表
.schema users        # 查看表结构
SELECT * FROM users; # 查询数据
.quit                # 退出
```

---

## 🌐 API 文档

### 基础 URL

- 开发环境: `http://localhost:7001/api`
- 生产环境: `http://your-domain/api`

### 主要接口

#### 认证相关
```
POST   /api/auth/login       - 用户登录
POST   /api/auth/register    - 用户注册
GET    /api/auth/current     - 获取当前用户
```

#### 用户管理
```
GET    /api/users            - 用户列表
POST   /api/users            - 创建用户
PUT    /api/users/:id/role   - 更新角色
DELETE /api/users/:id        - 删除用户
```

#### 任务管理
```
GET    /api/tasks            - 任务列表
POST   /api/tasks            - 创建任务
PUT    /api/tasks/:id        - 更新任务
DELETE /api/tasks/:id        - 删除任务
```

#### 发帖管理 ✨
```
GET    /api/posts            - 发帖记录
POST   /api/posts            - 创建发帖
DELETE /api/posts/:id        - 删除发帖
```

#### 搜索 ✨
```
GET    /api/search?keyword=xxx - 搜索内容
```

---

## 🚢 生产环境部署

### 使用 PM2 部署

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 构建项目

```bash
# 构建后端
cd backend-nest
npm run build

# 构建前端
cd ../frontend
npm run build
```

#### 3. 启动服务

```bash
# 返回项目根目录
cd ..

# 使用配置文件启动（会同时启动前后端）
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

#### 4. 保存配置（开机自启）

```bash
pm2 save
pm2 startup
```

#### 5. 管理服务

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

# 查看监控
pm2 monit
```

---

## 🔄 更新部署

```bash
# 1. 停止服务
pm2 stop all

# 2. 拉取最新代码
git pull

# 3. 更新后端
cd backend-nest
npm install
npm run migrate    # 运行新的数据库迁移
npm run build
pm2 restart merge-backend

# 4. 更新前端
cd ../frontend
npm install
npm run build
pm2 restart merge-frontend

# 5. 查看状态
pm2 status
```

---

## 🔐 安全建议

### 生产环境配置清单

- [ ] 修改默认管理员密码
- [ ] 使用强随机 JWT 密钥
- [ ] 配置 HTTPS
- [ ] 定期备份数据库
- [ ] 限制 API 访问频率
- [ ] 配置防火墙规则
- [ ] 定期更新依赖包

### 数据库安全

```bash
# 设置数据库文件权限（仅所有者可读写）
chmod 600 backend-nest/database/database.sqlite

# 定期备份
crontab -e
# 添加每天凌晨 2 点备份
0 2 * * * cd /path/to/project/backend-nest/database && cp database.sqlite database.sqlite.backup.$(date +\%Y\%m\%d)
```

---

## 📝 开发指南

### 后端开发

#### 创建新模块

```bash
cd backend-nest
nest g module <module-name>
nest g controller <module-name>
nest g service <module-name>
```

#### 创建数据库迁移

```bash
# 创建迁移文件
npm run migrate:make create_new_table

# 编辑 database/migrations/YYYYMMDD_create_new_table.ts

# 运行迁移
npm run migrate
```

#### 调试

```bash
# 开发模式（带热重载）
npm run start:dev

# 调试模式
npm run start:debug
```

### 前端开发

#### 创建新页面

```bash
cd frontend/src/pages
mkdir NewPage
touch NewPage/index.tsx
```

#### 添加路由

编辑 `frontend/.umirc.ts`:

```typescript
routes: [
  {
    path: '/new-page',
    name: '新页面',
    icon: 'smile',
    component: './NewPage',
  },
]
```

---

## 🐛 故障排查

### 后端无法启动

**问题**: 端口被占用
```bash
# 查找占用 7001 端口的进程
lsof -ti:7001

# 终止进程
lsof -ti:7001 | xargs kill -9
```

**问题**: 数据库错误
```bash
# 重新运行迁移
cd backend-nest
npm run migrate:rollback
npm run migrate
npm run seed
```

### 前端无法启动

**问题**: 端口被占用
```bash
# 查找占用 8000 端口的进程
lsof -ti:8000

# 终止进程
lsof -ti:8000 | xargs kill -9
```

**问题**: 依赖安装失败
```bash
# 清理缓存重新安装
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 无法登录

1. 检查后端是否正常运行
2. 确认默认管理员账号已创建：
   ```bash
   cd backend-nest
   npm run seed
   ```
3. 查看浏览器控制台网络请求
4. 查看后端日志：`pm2 logs merge-backend`

---

## 📚 技术文档

### 后端文档

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Knex 查询构建器](https://knexjs.org/)
- [SQLite 文档](https://www.sqlite.org/docs.html)

### 前端文档

- [Ant Design Pro](https://pro.ant.design/)
- [UmiJS 4](https://umijs.org/)
- [TinyMCE 富文本编辑器](https://www.tiny.cloud/docs/)

---

## 🎯 功能特性

### ✨ 发帖管理

- **批量发帖** - 支持多个账号批量发布
- **富文本编辑** - TinyMCE 富文本编辑器，支持源码编辑
- **发帖记录** - 查看发帖历史，支持筛选和排序
- **实时搜索** - 右侧固定搜索面板，随时搜索复制内容

### 🔍 搜索功能

- **全局搜索** - 搜索帖子、任务、合并请求等内容
- **智能高亮** - 搜索结果关键词高亮显示
- **分页加载** - 支持大量搜索结果分页展示

### 📋 任务看板

- **看板视图** - 拖拽式任务管理
- **状态流转** - 待办 → 进行中 → 测试 → 已部署
- **任务分配** - 指派任务给团队成员
- **筛选排序** - 按状态、优先级、时间筛选

### 🔀 合并请求

- **创建 MR** - 记录代码合并请求
- **状态追踪** - 待审核 → 已通过 → 已合并
- **Webhook 通知** - 自动发送通知到钉钉/企微/飞书

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## 📄 许可证

MIT License

---

## 📞 技术支持

如遇到问题，请：

1. 查看本文档的故障排查部分
2. 查看项目 Issues
3. 提交新的 Issue（请提供详细的错误信息和日志）

---

## 🎉 更新日志

### v2.0.0 (2026-01-12)

- ✨ 新增发帖管理功能
- ✨ 新增全局搜索功能
- 🔧 数据库从 MySQL + Sequelize 迁移到 SQLite + Knex
- ⚡ 性能优化：查询速度提升 20-40%
- 📦 依赖更新：使用最新版本的依赖包
- 🐛 修复若干已知问题

### v1.0.0

- 🎉 初始版本发布
- ✅ 用户管理
- ✅ 任务管理
- ✅ 合并请求管理
- ✅ Webhook 通知

---

**祝你使用愉快！** 🚀
