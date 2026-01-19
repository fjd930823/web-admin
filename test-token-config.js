#!/usr/bin/env node

/**
 * Xiuno Token 配置测试脚本（真正热更新版）
 * 
 * 特性：
 * - 每次发帖时自动读取最新配置文件
 * - 无需重启服务或调用重载接口
 * - 修改配置后立即生效
 */

const axios = require('axios');

// 配置
const CONFIG = {
  apiBaseUrl: 'http://localhost:3000',
  adminUsername: 'admin',
  adminPassword: 'admin123',
  testUsername: '312653114@qq.com',
  testPost: {
    title: `[测试] Token自动热更新 - ${new Date().toLocaleString()}`,
    board: '资源互助',
    content: `这是一条测试帖子

测试时间: ${new Date().toLocaleString()}
配置格式: 手机号=bbs_token=xxx,expires=ISO时间

✨ 特性：每次发帖自动读取最新配置，无需重启！`,
  },
};

async function test() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Xiuno Token 热更新测试');
  console.log('='.repeat(60) + '\n');

  try {
    // 步骤 1: 登录
    console.log('[1/2] 登录获取 JWT Token...');
    const loginResponse = await axios.post(
      `${CONFIG.apiBaseUrl}/auth/login`,
      {
        username: CONFIG.adminUsername,
        password: CONFIG.adminPassword,
      }
    );

    const jwtToken = loginResponse.data.access_token;
    console.log('✓ 登录成功\n');

    // 步骤 2: 发帖（自动读取最新配置）
    console.log('[2/2] 发帖测试（自动读取最新配置）...');
    console.log(`账号: ${CONFIG.testUsername}`);
    console.log(`标题: ${CONFIG.testPost.title}`);
    console.log('💡 系统会自动读取配置文件中的最新 Token\n');

    const postResponse = await axios.post(
      `${CONFIG.apiBaseUrl}/posts`,
      {
        username: CONFIG.testUsername,
        password: '',
        title: CONFIG.testPost.title,
        board: CONFIG.testPost.board,
        content: CONFIG.testPost.content,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    // 分析结果
    const { success, data, message } = postResponse.data;
    
    console.log('='.repeat(60));
    if (success && data.status === 'success') {
      console.log('✅ 测试成功！');
      console.log(`帖子 ID: ${data.id}`);
      console.log('配置文件热更新正常工作！');
    } else if (data.status === 'no_token') {
      console.log('❌ 未找到 Token 配置');
      console.log('\n请按以下步骤配置：');
      console.log('1. 浏览器登录 Xiuno');
      console.log('2. F12 -> Application -> Cookies');
      console.log('3. 找到 bbs_token，复制值');
      console.log('4. 编辑 xiuno-tokens.conf：');
      console.log(`   ${CONFIG.testUsername}=bbs_token=值,expires=过期时间`);
      console.log('5. 直接重新运行测试（配置自动生效）');
    } else if (data.status === 'token_expired') {
      console.log('❌ Token 已过期');
      console.log('\n请更新配置文件中的 token');
      console.log('修改后直接重新运行测试即可');
    } else {
      console.log(`❌ 发帖失败: ${message || data.error_message}`);
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ 错误');
    console.log('='.repeat(60));
    
    if (error.response) {
      console.log(`状态码: ${error.response.status}`);
      console.log(`错误: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log('无法连接到服务器');
      console.log('请确保后端服务已启动：cd backend-nest && npm run start:dev');
    } else {
      console.log(`错误: ${error.message}`);
    }
    console.log();
  }
}

// 显示帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Xiuno Token 热更新测试脚本

用法:
  node test-token-config.js

特性:
  ✅ 真正热更新 - 修改配置后立即生效
  ✅ 无需重启服务
  ✅ 无需调用重载接口
  ✅ 每次发帖自动读取最新配置

配置格式:
  手机号=bbs_token=xxx,expires=ISO时间

示例:
  312653114@qq.com=bbs_token=BrMo...iB8D5dL,expires=2026-04-29T01:38:58.528Z
`);
  process.exit(0);
}

test().catch(console.error);
