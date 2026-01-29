import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '前端管理系统',
  },
  routes: [
    {
      path: '/user',
      layout: false,
      routes: [
        {
          name: 'login',
          path: '/user/login',
          component: './User/Login',
        },
        {
          name: 'register',
          path: '/user/register',
          component: './User/Register',
        },
      ],
    },
    {
      path: '/welcome',
      name: '欢迎',
      icon: 'smile',
      component: './Welcome',
    },
    {
      path: '/users',
      name: '用户管理',
      icon: 'team',
      component: './User/Management',
      access: 'canAdmin',
    },
    {
      path: '/tasks',
      name: '任务看板',
      icon: 'project',
      routes: [
        {
          path: '/tasks',
          redirect: '/tasks/board',
        },
        {
          name: '任务看板',
          path: '/tasks/board',
          component: './Task/Board',
        },
        {
          name: '创建任务',
          path: '/tasks/create',
          component: './Task/Create',
          hideInMenu: true,
        },
        {
          name: '编辑任务',
          path: '/tasks/edit/:id',
          component: './Task/Edit',
          hideInMenu: true,
        },
      ],
    },
    {
      path: '/merge-requests',
      name: '合并请求',
      icon: 'table',
      component: './MergeRequest/List',
    },
    {
      path: '/posts',
      name: '发帖管理',
      icon: 'form',
      routes: [
        {
          path: '/posts',
          redirect: '/posts/create',
        },
        {
          name: '发帖',
          path: '/posts/create',
          component: './Post/Create',
        },
        {
          name: '发帖记录',
          path: '/posts/history',
          component: './Post/History',
        },
      ],
    },
    {
      path: '/tokens',
      name: 'Token 管理',
      icon: 'key',
      component: './Token/Manage',
    },
    {
      path: '/operation-logs',
      name: '操作日志',
      icon: 'fileText',
      component: './OperationLogs',
      access: 'canAdmin',
    },
    {
      path: '/',
      redirect: '/welcome',
    },
    {
      path: '*',
      layout: false,
      component: './404',
    },
  ],
  npmClient: 'npm',
  proxy: {
    '/api': {
      target: 'http://localhost:7001',
      changeOrigin: true,
    },
  },
});