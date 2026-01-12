import { request } from '@umijs/max';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export interface MergeRequest {
  id?: number;
  title: string;
  description?: string;
  source_branch: string;
  target_branch: string;
  repository_url: string;
  merge_url: string;
  status?: 'pending' | 'approved' | 'rejected' | 'merged';
  assignee_id?: number;
  creator_id?: number;
  merged_by?: number;
  merged_at?: string;
  creator_name?: string;
  assignee_name?: string;
  merger_name?: string;
  created_at?: string;
  updated_at?: string;
}

// 认证相关 API
export async function login(params: LoginParams) {
  return request<{
    success: boolean;
    data: {
      token: string;
      user: any;
    };
  }>('/api/auth/login', {
    method: 'POST',
    data: params,
  });
}

export async function register(params: RegisterParams) {
  return request<{
    success: boolean;
    data: any;
  }>('/api/auth/register', {
    method: 'POST',
    data: params,
  });
}

export async function getCurrentUser() {
  return request<{
    success: boolean;
    data: any;
  }>('/api/auth/current');
}

// 合并请求相关 API
export async function getMergeRequests(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  return request<{
    success: boolean;
    data: MergeRequest[];
    total: number;
  }>('/api/merge-requests', {
    method: 'GET',
    params,
  });
}

export async function getMergeRequest(id: number) {
  return request<{
    success: boolean;
    data: MergeRequest;
  }>(`/api/merge-requests/${id}`);
}

export async function createMergeRequest(data: MergeRequest) {
  return request<{
    success: boolean;
    data: MergeRequest;
  }>('/api/merge-requests', {
    method: 'POST',
    data,
  });
}

export async function updateMergeRequest(id: number, data: Partial<MergeRequest>) {
  return request<{
    success: boolean;
    data: MergeRequest;
  }>(`/api/merge-requests/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteMergeRequest(id: number) {
  return request<{
    success: boolean;
  }>(`/api/merge-requests/${id}`, {
    method: 'DELETE',
  });
}

// 用户管理相关 API
export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
  username?: string;
  role?: string;
}) {
  return request<{
    success: boolean;
    data: any[];
    total: number;
  }>('/api/users', {
    method: 'GET',
    params,
  });
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role: string;
}) {
  return request<{
    success: boolean;
    data: any;
  }>('/api/users', {
    method: 'POST',
    data,
  });
}

export async function updateUserRole(id: number, role: string) {
  return request<{
    success: boolean;
    data: any;
  }>(`/api/users/${id}/role`, {
    method: 'PUT',
    data: { role },
  });
}

export async function deleteUser(id: number) {
  return request<{
    success: boolean;
  }>(`/api/users/${id}`, {
    method: 'DELETE',
  });
}

export async function resetUserPassword(id: number, password: string) {
  return request<{
    success: boolean;
    message: string;
  }>(`/api/users/${id}/password`, {
    method: 'PUT',
    data: { password },
  });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return request<{
    success: boolean;
    message: string;
  }>('/api/users/change-password', {
    method: 'PUT',
    data: { oldPassword, newPassword },
  });
}

// 任务相关接口
export interface Task {
  id?: number;
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'dev_complete' | 'testing' | 'deployed' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: number;
  creator_id?: number;
  start_date?: string;
  due_date?: string;
  sort_order?: number;
  creator_name?: string;
  assignee_name?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getTasks(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  assignee_id?: number;
  year?: number;
  month?: number;
}) {
  return request<{
    success: boolean;
    data: Task[];
    total: number;
  }>('/api/tasks', {
    method: 'GET',
    params,
  });
}

export async function getTask(id: number) {
  return request<{
    success: boolean;
    data: Task;
  }>(`/api/tasks/${id}`);
}

export async function createTask(data: Task) {
  return request<{
    success: boolean;
    data: Task;
  }>('/api/tasks', {
    method: 'POST',
    data,
  });
}

export async function updateTask(id: number, data: Partial<Task>) {
  return request<{
    success: boolean;
    data: Task;
  }>(`/api/tasks/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function updateTaskStatus(id: number, status: string, sort_order?: number) {
  return request<{
    success: boolean;
    data: Task;
  }>(`/api/tasks/${id}/status`, {
    method: 'PUT',
    data: { status, sort_order },
  });
}

export async function deleteTask(id: number) {
  return request<{
    success: boolean;
  }>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

// 发帖相关接口
export interface Post {
  id?: number;
  username: string;
  password: string;
  title: string;
  content: string;
  status?: 'success' | 'failed';
  error_message?: string;
  created_at?: string;
}

export interface PostFormData {
  accounts: Array<{
    username: string;
    password: string;
  }>;
  title: string;
  content: string;
}

export async function submitPost(data: { username: string; password: string; title: string; content: string }) {
  return request<{
    success: boolean;
    data?: any;
    message?: string;
  }>('/api/posts', {
    method: 'POST',
    data,
  });
}

export async function getPostHistory(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  username?: string;
  title?: string;
  sortField?: string;
  sortOrder?: string;
}) {
  return request<{
    success: boolean;
    data: Post[];
    total: number;
  }>('/api/posts', {
    method: 'GET',
    params,
  });
}

export async function deletePost(id: number) {
  return request<{
    success: boolean;
  }>(`/api/posts/${id}`, {
    method: 'DELETE',
  });
}

// 搜索相关接口（根据实际需求调整）
export async function searchContent(params: { keyword: string; type?: string }) {
  return request<{
    success: boolean;
    data: any[];
  }>('/api/search', {
    method: 'GET',
    params,
  });
}