import { request } from '@umijs/max';

export interface TokenConfig {
  phone: string;
  bbs_token: string;
  expires?: string;
}

/** 获取所有 token 配置 */
export async function getAllTokens() {
  return request<{
    success: boolean;
    data: TokenConfig[];
  }>('/api/tokens', {
    method: 'GET',
  });
}

/** 添加 token 配置 */
export async function addToken(data: TokenConfig) {
  return request<{
    success: boolean;
    message: string;
  }>('/api/tokens', {
    method: 'POST',
    data,
  });
}

/** 更新 token 配置 */
export async function updateToken(phone: string, data: TokenConfig) {
  return request<{
    success: boolean;
    message: string;
  }>(`/api/tokens/${encodeURIComponent(phone)}`, {
    method: 'PUT',
    data,
  });
}

/** 删除 token 配置 */
export async function deleteToken(phone: string) {
  return request<{
    success: boolean;
    message: string;
  }>(`/api/tokens/${encodeURIComponent(phone)}`, {
    method: 'DELETE',
  });
}

/** 批量更新 tokens */
export async function batchUpdateTokens(tokens: TokenConfig[]) {
  return request<{
    success: boolean;
    message: string;
  }>('/api/tokens/batch', {
    method: 'POST',
    data: { tokens },
  });
}
