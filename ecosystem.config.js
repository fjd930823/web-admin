// PM2配置文件 - 自动从.env加载环境变量
const fs = require('fs');
const path = require('path');

// 从.env文件读取配置
function loadEnvFile(envPath) {
  const env = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
          env[key.trim()] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      }
    });
  }
  return env;
}

// 加载backend的.env文件
const backendEnv = loadEnvFile(path.join(__dirname, 'backend-nest', '.env'));

module.exports = {
  apps: [
    {
      // 应用名称，用于 pm2 命令中识别应用
      name: 'merge-backend',

      // 工作目录，应用启动时的根目录
      cwd: './backend-nest',

      // 启动脚本路径（相对于 cwd）
      script: 'dist/main.js',

      // 实例数量：'max' = CPU核心数，数字 = 固定数量，-1 = CPU核心数-1
      instances: 'max',

      // 执行模式：'cluster' = 集群模式（多实例负载均衡），'fork' = 单进程模式
      exec_mode: 'cluster',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        ...backendEnv, // 自动加载.env文件的所有变量
      },

      // 错误日志文件路径
      error_file: './logs/backend-error.log',

      // 标准输出日志文件路径
      out_file: './logs/backend-out.log',

      // 日志时间格式
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // 是否合并多个实例的日志到同一个文件
      merge_logs: true,

      // 进程崩溃或退出时是否自动重启
      autorestart: true,

      // 是否监听文件变化并自动重启（开发环境用，生产环境建议关闭）
      watch: false,

      // 内存超过此值时自动重启（防止内存泄漏）
      max_memory_restart: '500M',
    },
    {
      // 前端应用名称
      name: 'merge-frontend',

      // 前端工作目录
      cwd: './frontend',

      // 使用 npx 命令启动
      script: 'npx',

      // 传递给 script 的参数（这里是 serve dist -p 8000）
      args: 'serve dist -p 8000',

      // 前端静态服务只需要 1 个实例
      instances: 1,

      // 单进程模式
      exec_mode: 'fork',

      // 环境变量
      env: {
        NODE_ENV: 'production',
      },

      // 错误日志
      error_file: './logs/frontend-error.log',

      // 标准输出日志
      out_file: './logs/frontend-out.log',

      // 日志时间格式
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // 合并日志
      merge_logs: true,

      // 自动重启
      autorestart: true,

      // 不监听文件变化
      watch: false,
    },
  ],
};