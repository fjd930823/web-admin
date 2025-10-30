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
      name: 'merge-backend',
      cwd: './backend-nest',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        ...backendEnv, // 自动加载.env文件的所有变量
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'merge-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'serve dist -p 8000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
  ],
};