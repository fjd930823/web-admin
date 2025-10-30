/**
 * 分页工具函数
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
}

/**
 * 解析分页参数
 * @param query 查询参数对象
 * @param defaultPageSize 默认每页数量
 * @returns 解析后的分页参数
 */
export function parsePagination(
  query: any,
  defaultPageSize: number = 10,
): PaginationParams {
  const page = parseInt(query.page as string, 10) || 1;
  const pageSize = parseInt(query.pageSize as string, 10) || defaultPageSize;

  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

/**
 * 格式化分页响应
 * @param rows 数据列表
 * @param count 总数
 * @param page 当前页
 * @param pageSize 每页数量
 * @returns 格式化后的响应
 */
export function formatPaginationResponse<T>(
  rows: T[],
  count: number,
  page?: number,
  pageSize?: number,
) {
  const response: any = {
    list: rows,
    total: count,
  };

  if (page && pageSize) {
    response.page = page;
    response.pageSize = pageSize;
    response.totalPages = Math.ceil(count / pageSize);
  }

  return response;
}
