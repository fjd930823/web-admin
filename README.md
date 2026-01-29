
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

### 运行数据库迁移

```bash
# 创建数据库表
npm run migrate

# 创建默认管理员账号
npm run seed
```

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

## 🌐 API 文档

### 基础 URL

- 开发环境: `http://localhost:7001/api`
- 生产环境: `http://your-domain/api`


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

### 后端文档

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Knex 查询构建器](https://knexjs.org/)
- [SQLite 文档](https://www.sqlite.org/docs.html)

### 前端文档

- [Ant Design Pro](https://pro.ant.design/)
- [UmiJS 4](https://umijs.org/)
- [TinyMCE 富文本编辑器](https://www.tiny.cloud/docs/)

### sqlite重编译
yum install -y gcc-toolset-11 python38 && \
scl enable gcc-toolset-11 bash << 'EOFSCL'
echo "=== 环境版本 ===" && \
gcc --version && \
python3.8 --version && \
export PYTHON=/usr/bin/python3.8 && \
export npm_config_python=/usr/bin/python3.8 && \
echo "python=/usr/bin/python3.8" > /www/wwwroot/web-admin/backend-nest/.npmrc && \
cd /www/wwwroot/web-admin/backend-nest && \
echo "=== 清理旧编译 ===" && \
rm -rf node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/build && \
rm -rf ~/.cache/node-gyp && \
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && \
echo "=== 开始编译 better-sqlite3 ===" && \
npm run build-release && \
echo "=== 编译结果 ===" && \
ls -la build/Release/better_sqlite3.node && \
cd /www/wwwroot/web-admin/backend-nest && \
echo "=== 编译项目 ===" && \
rm -rf dist && \
npm run build && \
cd /www/wwwroot/web-admin && \
echo "=== 重启服务 ===" && \
pm2 delete all && \
pm2 start ecosystem.config.js && \
sleep 3 && \
pm2 status
EOFSCL



cd /www/wwwroot/web-admin/backend-nest

# 创建 .npmrc 文件
cat > .npmrc << EOF
python=/usr/bin/python3.8
EOF

# 清理并重装
rm -rf node_modules pnpm-lock.yaml ~/.cache/node-gyp
pnpm install
