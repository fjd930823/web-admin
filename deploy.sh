#!/bin/bash
# 生产环境部署脚本
# 用途：拉取最新代码、备份数据库、运行迁移、构建并重启服务
#
# 使用方法：
#   ./deploy.sh           - 完整部署（数据库+编译+重启）
#   ./deploy.sh --db-only - 仅迁移数据库

set -e  # 遇到错误立即退出

# 解析命令行参数
DB_ONLY=false
if [ "$1" == "--db-only" ] || [ "$1" == "-d" ]; then
    DB_ONLY=true
fi

# 配置
PROJECT_DIR="/www/wwwroot/web-admin"
BACKEND_DIR="$PROJECT_DIR/backend-nest"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 开始部署
echo ""
log_info "=========================================="
if [ "$DB_ONLY" = true ]; then
    log_info "🗄️  数据库迁移模式"
else
    log_info "🚀 完整部署模式"
fi
log_info "=========================================="
echo ""

# 1. 进入项目目录
log_info "📁 进入项目目录..."
cd "$PROJECT_DIR" || exit 1

# 2-3. Git 操作（仅完整部署模式）
if [ "$DB_ONLY" = false ]; then
    # log_info "📊 当前 Git 状态："
    # git status -s
    # git branch --show-current

    # log_info "📥 拉取最新代码..."
    # git fetch origin
    # git pull origin main

    log_success "代码更新完成"
    echo ""
fi

# 4. 进入后端目录
cd "$BACKEND_DIR"

# 5. 安装依赖（仅完整部署模式）
if [ "$DB_ONLY" = false ]; then
    log_info "📦 安装后端依赖..."
    pnpm install
    echo ""
fi

# 6. 数据库迁移部分
log_info "🔄 数据库迁移..."

# 6.1 备份数据库
if [ -f "database/database.sqlite" ]; then
    BACKUP_FILE="database/database.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
    cp database/database.sqlite "$BACKUP_FILE"
    log_success "💾 数据库已备份至: $BACKUP_FILE"
else
    log_warning "数据库文件不存在（首次运行）"
fi
echo ""

# 辅助函数
check_table_exists() {
    sqlite3 database/database.sqlite "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='$1';" 2>/dev/null || echo "0"
}

check_column_exists() {
    sqlite3 database/database.sqlite "PRAGMA table_info($1);" 2>/dev/null | grep -c "^[0-9]*|$2|" || echo "0"
}

check_migration_exists() {
    sqlite3 database/database.sqlite "SELECT COUNT(*) FROM knex_migrations WHERE name='$1';" 2>/dev/null || echo "0"
}

insert_migration() {
    local migration=$1
    local reason=$2
    if [ "$(check_migration_exists "$migration")" -eq 0 ]; then
        CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
        sqlite3 database/database.sqlite "INSERT INTO knex_migrations (name, batch, migration_time) VALUES ('$migration', 1, '$CURRENT_TIME');"
        log_success "✓ 已标记: $migration ($reason)"
    fi
}

# 确保迁移表存在
sqlite3 database/database.sqlite "CREATE TABLE IF NOT EXISTS knex_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, batch INTEGER, migration_time DATETIME);" 2>/dev/null || true

# 检查并标记已存在的表和字段
log_info "检查现有数据库结构..."

# 检查各个表
[ "$(check_table_exists 'users')" -eq 1 ] && insert_migration "20240101_create_users_table.ts" "users表已存在"
[ "$(check_table_exists 'tasks')" -eq 1 ] && insert_migration "20240102_create_tasks_table.ts" "tasks表已存在"
[ "$(check_table_exists 'merge_requests')" -eq 1 ] && insert_migration "20240103_create_merge_requests_table.ts" "merge_requests表已存在"
[ "$(check_table_exists 'posts')" -eq 1 ] && insert_migration "20240104_create_posts_table.ts" "posts表已存在"
[ "$(check_table_exists 'operation_logs')" -eq 1 ] && insert_migration "20240110_create_operation_logs_table.ts" "operation_logs表已存在"

# 检查 posts 表的字段
if [ "$(check_table_exists 'posts')" -eq 1 ]; then
    [ "$(check_column_exists 'posts' 'board')" -gt 0 ] && insert_migration "20240105_add_board_to_posts.ts" "board字段已存在"
    [ "$(check_column_exists 'posts' 'tags')" -gt 0 ] && insert_migration "20240106_add_tags_to_posts.ts" "tags字段已存在"
    
    # xiuno 相关字段
    if [ "$(check_column_exists 'posts' 'xiuno_session_id')" -gt 0 ] || \
       [ "$(check_column_exists 'posts' 'xiuno_board')" -gt 0 ] || \
       [ "$(check_column_exists 'posts' 'xiuno_cookie')" -gt 0 ]; then
        insert_migration "20240107_add_xiuno_fields_to_posts.ts" "xiuno字段已存在"
    fi
    
    # 检查 password 字段是否已删除
    [ "$(check_column_exists 'posts' 'password')" -eq 0 ] && insert_migration "20240109_remove_password_from_posts.ts" "password字段已删除"
fi

# 显示迁移状态
log_info "📊 当前迁移状态："
npm run knex -- migrate:status
echo ""

# 运行新的迁移
log_info "🚀 运行待执行的迁移..."
if npm run migrate; then
    log_success "数据库迁移完成"
else
    log_error "数据库迁移失败！"
    log_info "💡 数据库已备份至: $BACKUP_FILE"
    log_info "💡 恢复命令: cp $BACKUP_FILE database/database.sqlite"
    exit 1
fi

# 显示最终状态
log_info "📊 最终迁移状态："
npm run knex -- migrate:status
echo ""

# 如果是仅数据库模式，到此结束
if [ "$DB_ONLY" = true ]; then
    log_success "=========================================="
    log_success "✅ 数据库迁移完成！"
    log_success "=========================================="
    echo ""
    if [ -n "$BACKUP_FILE" ]; then
        log_info "💾 备份文件: $BACKUP_FILE"
        log_info "💡 如需回滚: cp $BACKUP_FILE database/database.sqlite"
    fi
    echo ""
    log_info "💡 提示：如果修改了数据库结构，可能需要重启后端服务："
    echo "   pm2 restart merge-backend"
    echo ""
    exit 0
fi

# 以下为完整部署模式

# 5.5 编译后端
log_info "🔨 编译后端代码..."
npm run build
log_success "后端编译完成"
echo ""

# 6. 更新前端
log_info "🎨 更新前端..."
cd "$FRONTEND_DIR"

# 6.1 安装依赖
log_info "📦 安装前端依赖..."
pnpm install

# 6.2 清理旧的生成文件
log_info "🧹 清理旧的生成文件..."
rm -rf .umi src/.umi node_modules/.cache dist

# 6.3 构建前端
log_info "🔨 构建前端代码..."
if npm run build; then
    log_success "前端构建完成"
else
    log_error "前端构建失败！"
    exit 1
fi
echo ""

# 7. 重启服务
log_info "♻️  重启服务..."
cd "$PROJECT_DIR"

# 检查 PM2 是否在运行
if pm2 list | grep -q "merge-backend"; then
    log_info "重启后端服务..."
    pm2 restart merge-backend
    log_success "后端服务已重启"
else
    log_warning "后端服务未运行，启动服务..."
    pm2 start ecosystem.config.js --only merge-backend
fi

if pm2 list | grep -q "merge-frontend"; then
    log_info "重启前端服务..."
    pm2 restart merge-frontend
    log_success "前端服务已重启"
else
    log_warning "前端服务未运行，启动服务..."
    pm2 start ecosystem.config.js --only merge-frontend
fi

# 保存 PM2 配置
pm2 save

echo ""
log_success "=========================================="
log_success "✅ 完整部署完成！"
log_success "=========================================="
echo ""

# 8. 显示服务状态
log_info "📊 服务运行状态："
pm2 status

echo ""
log_info "📝 查看最近日志："
pm2 logs --lines 20 --nostream

echo ""
log_info "💡 提示："
echo "   - 查看实时日志: pm2 logs"
echo "   - 查看监控: pm2 monit"
echo "   - 重启服务: pm2 restart all"
if [ -n "$BACKUP_FILE" ]; then
    echo "   - 恢复数据库: cp $BACKUP_FILE database/database.sqlite"
fi
echo ""
