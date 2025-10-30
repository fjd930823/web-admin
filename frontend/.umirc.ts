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