# 前端应用 - React + Ant Design Pro + UmiJS

## 📋 技术栈

- **React** 18.x - UI 框架
- **Ant Design Pro** 6.x - 企业级中后台框架
- **UmiJS** 4.x - React 应用框架
- **TinyMCE** 6.x - 富文本编辑器
- **TypeScript** 5.x - 类型安全
- **Ant Design** 5.x - UI 组件库

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将运行在：`http://localhost:8000`

### 3. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录

---

## 🎨 功能模块

### ✅ 用户管理
- 用户登录/注册
- 用户列表（管理员）
- 角色管理（管理员/普通用户）
- 密码修改

### ✅ 任务管理
- 任务看板（拖拽式）
- 任务创建/编辑/删除
- 任务状态流转
- 任务筛选和排序

### ✅ 合并请求
- MR 创建/编辑/删除
- 状态追踪
- Webhook 配置

### ✨ 发帖管理（新功能）
- **批量发帖** - 支持多账号批量发布
- **富文本编辑** - TinyMCE 编辑器，支持源码编辑
- **发帖记录** - 查看历史记录，支持筛选
- **实时搜索** - 右侧固定搜索面板

### 🔍 内容搜索（新功能）
- 全局搜索功能
- 关键词高亮
- 实时搜索结果

---

## 📁 项目结构

```
frontend/
├── src/
│   ├── pages/                 # 页面组件
│   │   ├── User/             # 用户管理
│   │   │   ├── Login/        # 登录页
│   │   │   ├── Register/     # 注册页
│   │   │   └── Management/   # 用户管理
│   │   ├── Task/             # 任务管理
│   │   │   ├── Board/        # 任务看板
│   │   │   ├── Create/       # 创建任务
│   │   │   └── Edit/         # 编辑任务
│   │   ├── MergeRequest/     # 合并请求
│   │   │   └── List/         # MR 列表
│   │   ├── Post/             # 发帖管理 ✨
│   │   │   ├── Create/       # 发帖页（批量发帖+搜索）
│   │   │   └── History/      # 发帖记录
│   │   └── Welcome.tsx       # 欢迎页
│   ├── services/             # API 服务
│   │   └── api.ts           # API 接口定义
│   ├── components/           # 公共组件
│   ├── access.ts            # 权限定义
│   ├── app.tsx              # 应用配置
│   └── global.tsx           # 全局配置
├── public/                   # 静态资源
├── .umirc.ts                # UmiJS 配置
├── package.json
└── tsconfig.json            # TypeScript 配置
```

---

## ⚙️ 配置说明

### UmiJS 配置 (.umirc.ts)

```typescript
export default {
  // 路由配置
  routes: [
    // ...路由定义
  ],

  // 代理配置（开发环境）
  proxy: {
    '/api': {
      target: 'http://localhost:7001',
      changeOrigin: true,
    },
  },

  // Ant Design Pro 配置
  antd: {},
  
  // 其他配置...
};
```

### API 代理

开发环境下，所有 `/api/*` 请求会被代理到 `http://localhost:7001`

---

## 🎯 路由说明

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 欢迎页 | 首页 |
| `/user/login` | 登录 | 用户登录 |
| `/user/register` | 注册 | 用户注册 |
| `/user/management` | 用户管理 | 管理员功能 |
| `/tasks` | 任务看板 | 任务管理（看板视图） |
| `/tasks/create` | 创建任务 | 新建任务 |
| `/merge-requests` | 合并请求 | MR 列表 |
| `/posts/create` | 发帖 | 批量发帖 + 搜索 ✨ |
| `/posts/history` | 发帖记录 | 发帖历史 ✨ |

---

## 🎨 主题定制

### 修改主题色

编辑 `.umirc.ts`:

```typescript
export default {
  theme: {
    '@primary-color': '#1890ff', // 主题色
    '@border-radius-base': '4px', // 圆角
  },
};
```

### 自定义样式

在 `src/global.less` 中添加全局样式：

```less
// 全局样式
.custom-class {
  // 样式定义
}
```

---

## 🔌 API 集成

### API 服务定义

所有 API 接口定义在 `src/services/api.ts`:

```typescript
import { request } from '@umijs/max';

// 用户登录
export async function login(params: LoginParams) {
  return request('/api/auth/login', {
    method: 'POST',
    data: params,
  });
}

// 获取任务列表
export async function getTasks(params?: any) {
  return request('/api/tasks', {
    method: 'GET',
    params,
  });
}
```

### 在组件中使用

```typescript
import { login, getTasks } from '@/services/api';

// 登录
const handleLogin = async (values) => {
  const result = await login(values);
  console.log(result);
};

// 获取任务
const loadTasks = async () => {
  const tasks = await getTasks({ status: 'todo' });
  console.log(tasks);
};
```

---

## 🔐 权限管理

### 权限定义

在 `src/access.ts` 中定义权限：

```typescript
export default (initialState: { currentUser?: API.CurrentUser }) => {
  const { currentUser } = initialState || {};
  
  return {
    // 是否是管理员
    canAdmin: currentUser?.role === 'admin',
    
    // 是否已登录
    canUser: !!currentUser,
  };
};
```

### 在路由中使用权限

```typescript
{
  path: '/user/management',
  name: '用户管理',
  access: 'canAdmin', // 只有管理员可访问
  component: './User/Management',
}
```

### 在组件中使用权限

```typescript
import { useAccess } from '@umijs/max';

const Component = () => {
  const access = useAccess();

  return (
    <div>
      {access.canAdmin && (
        <Button>管理员操作</Button>
      )}
    </div>
  );
};
```

---

## 🎭 状态管理

使用 UmiJS 的 `useModel` 进行状态管理：

```typescript
import { useModel } from '@umijs/max';

const Component = () => {
  // 获取全局初始状态
  const { initialState, setInitialState } = useModel('@@initialState');

  // 更新用户信息
  const updateUser = async () => {
    const user = await fetchCurrentUser();
    setInitialState({ currentUser: user });
  };

  return <div>...</div>;
};
```

---

## 🛠️ 开发工具

### 常用命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run lint:fix

# 类型检查
npm run tsc
```

### 开发工具推荐

- **VS Code** - 代码编辑器
  - 推荐插件：
    - ESLint
    - Prettier
    - TypeScript Vue Plugin (Volar)
- **React Developer Tools** - Chrome 扩展
- **Redux DevTools** - 状态调试（如果使用）

---

## 📦 构建优化

### 分析构建产物

```bash
# 生成分析报告
ANALYZE=1 npm run build
```

### 优化建议

1. **按需加载** - 使用动态 import
   ```typescript
   const Component = React.lazy(() => import('./Component'));
   ```

2. **代码分割** - 路由级别自动分割
   ```typescript
   routes: [
     {
       path: '/page',
       component: './Page', // 自动代码分割
     },
   ]
   ```

3. **图片优化** - 使用 WebP 格式，压缩图片

4. **CDN 加速** - 静态资源使用 CDN

---

## 🧪 测试

### 单元测试

```bash
# 运行测试
npm run test

# 生成覆盖率报告
npm run test:coverage
```

### E2E 测试

```bash
# 运行 E2E 测试
npm run test:e2e
```

---

## 🐛 故障排查

### 端口被占用

```bash
# 查找进程
lsof -ti:8000

# 终止进程
lsof -ti:8000 | xargs kill -9
```

### 依赖问题

```bash
# 清理缓存
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 编译错误

```bash
# 清理 UmiJS 缓存
rm -rf .umi .umi-production

# 重新启动
npm run dev
```

### 代理不工作

检查 `.umirc.ts` 中的 proxy 配置：

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:7001', // 确认后端地址
    changeOrigin: true,
    pathRewrite: { '^/api': '/api' }, // 可选
  },
}
```

---

## 🎨 组件库

### Ant Design 组件

```typescript
import { Button, Table, Form, Input } from 'antd';

const MyComponent = () => {
  return (
    <Form>
      <Form.Item label="用户名" name="username">
        <Input />
      </Form.Item>
      <Button type="primary">提交</Button>
    </Form>
  );
};
```

### Ant Design Pro 组件

```typescript
import { ProTable, PageContainer } from '@ant-design/pro-components';

const MyPage = () => {
  return (
    <PageContainer>
      <ProTable
        columns={columns}
        request={async (params) => {
          const data = await fetchData(params);
          return { data, success: true };
        }}
      />
    </PageContainer>
  );
};
```

---

## 📚 参考文档

- [Ant Design Pro 官方文档](https://pro.ant.design/)
- [UmiJS 4 文档](https://umijs.org/)
- [Ant Design 组件库](https://ant.design/)
- [React 官方文档](https://react.dev/)
- [TinyMCE 文档](https://www.tiny.cloud/docs/)

---

## 🎉 新功能说明

### 发帖管理

#### 发帖页面 (/posts/create)

**特点：**
- 左侧（66.7%）：发帖表单区域
- 右侧（33.3%）：固定搜索面板

**功能：**
1. **批量发帖** - 支持多个表单，每个表单可输入多个账号
2. **富文本编辑** - TinyMCE 编辑器，支持：
   - 源码编辑（点击 `代码` 按钮）
   - 表格插入
   - 图片上传
   - 代码块
   - 完整工具栏
3. **实时搜索** - 右侧搜索面板：
   - 输入关键词搜索
   - 结果实时显示
   - 可直接复制内容
   - 无需打开/关闭弹窗

#### 发帖记录 (/posts/history)

**功能：**
- 查看所有发帖记录
- 按时间排序
- 按账号筛选
- 按标题搜索
- 管理员可删除记录

---

**祝你开发愉快！** 🚀
