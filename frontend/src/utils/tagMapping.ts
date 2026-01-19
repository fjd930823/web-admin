/**
 * 标签映射工具
 * 从 datatag.json 加载板块和标签配置，实现标签名称到ID的转换
 */

// 板块名称到ID的映射
export const BOARD_NAME_TO_ID: Record<string, string> = {
  '资源互助': '45',
  '反馈': '43',
  '电影': '2',
  '电视剧': '48',
  '动漫': '37',
  '综艺': '52',
  '4K原盘': '56',
  '音频': '40',
  '电子书': '51',
  '设计专区': '42',
  '工具': '57',
  '体育专区': '58',
};

// 标签配置缓存
let tagDataCache: any = null;

/**
 * 加载标签配置
 */
export async function loadTagData() {
  if (tagDataCache) {
    return tagDataCache;
  }
  
  try {
    const response = await fetch('/datatag.json');
    tagDataCache = await response.json();
    return tagDataCache;
  } catch (error) {
    console.error('加载标签配置失败:', error);
    return null;
  }
}

/**
 * 获取板块的标签分类列表
 * @param boardName 板块名称
 * @returns 标签分类列表 { 分类名: [标签名1, 标签名2, ...] }
 */
export async function getBoardTags(boardName: string): Promise<Record<string, string[]>> {
  const tagData = await loadTagData();
  if (!tagData) {
    return {};
  }
  
  const boardId = BOARD_NAME_TO_ID[boardName];
  if (!boardId || !tagData[boardId]) {
    return {};
  }
  
  const boardInfo = tagData[boardId];
  const result: Record<string, string[]> = {};
  
  // 遍历标签分类
  if (Array.isArray(boardInfo.tagcatelist)) {
    for (const category of boardInfo.tagcatelist) {
      const categoryName = category.name;
      const tags: string[] = [];
      
      if (Array.isArray(category.taglist)) {
        for (const tag of category.taglist) {
          if (tag.name) {
            tags.push(tag.name);
          }
        }
      }
      
      if (tags.length > 0) {
        result[categoryName] = tags;
      }
    }
  }
  
  return result;
}

/**
 * 将标签名称转换为ID
 * @param boardName 板块名称
 * @param tagNames 标签名称数组，格式：['分类:求资源', '状态:未解决'] 或 ['求资源', '未解决']
 * @returns 标签ID数组的逗号分隔字符串
 */
export async function convertTagNamesToIds(
  boardName: string,
  tagNames: string[]
): Promise<string> {
  const tagData = await loadTagData();
  if (!tagData || tagNames.length === 0) {
    return '';
  }
  
  const boardId = BOARD_NAME_TO_ID[boardName];
  if (!boardId || !tagData[boardId]) {
    return '';
  }
  
  const boardInfo = tagData[boardId];
  const tagIds: string[] = [];
  
  // 创建标签名称到ID的映射
  const nameToIdMap: Record<string, string> = {};
  if (Array.isArray(boardInfo.tagcatelist)) {
    for (const category of boardInfo.tagcatelist) {
      if (Array.isArray(category.taglist)) {
        for (const tag of category.taglist) {
          if (tag.name && tag.tagid) {
            nameToIdMap[tag.name] = tag.tagid;
          }
        }
      }
    }
  }
  
  // 转换标签名称为ID
  for (const tagName of tagNames) {
    // 处理 "分类:求资源" 格式
    const parts = tagName.split(':');
    const actualTagName = parts.length > 1 ? parts[1].trim() : tagName.trim();
    
    const tagId = nameToIdMap[actualTagName];
    if (tagId) {
      tagIds.push(tagId);
    } else {
      console.warn(`未找到标签 "${actualTagName}" 的ID (板块: ${boardName})`);
    }
  }
  
  return tagIds.join(',');
}

/**
 * 获取板块信息
 * @param boardName 板块名称
 * @returns 板块信息
 */
export async function getBoardInfo(boardName: string) {
  const tagData = await loadTagData();
  if (!tagData) {
    return null;
  }
  
  const boardId = BOARD_NAME_TO_ID[boardName];
  if (!boardId || !tagData[boardId]) {
    return null;
  }
  
  return tagData[boardId];
}

/**
 * 将标签ID转换回标签名称（用于显示）
 * @param boardName 板块名称
 * @param tagIds 标签ID字符串（逗号分隔），如 "167,169"
 * @returns 标签名称数组
 */
export async function convertTagIdsToNames(
  boardName: string,
  tagIds: string
): Promise<string[]> {
  const tagData = await loadTagData();
  if (!tagData || !tagIds) {
    return [];
  }
  
  const boardId = BOARD_NAME_TO_ID[boardName];
  if (!boardId || !tagData[boardId]) {
    return [];
  }
  
  const boardInfo = tagData[boardId];
  const tagNames: string[] = [];
  
  // 创建 ID 到名称的映射
  const idToNameMap: Record<string, string> = {};
  if (Array.isArray(boardInfo.tagcatelist)) {
    for (const category of boardInfo.tagcatelist) {
      if (Array.isArray(category.taglist)) {
        for (const tag of category.taglist) {
          if (tag.tagid && tag.name) {
            idToNameMap[tag.tagid] = tag.name;
          }
        }
      }
    }
  }
  
  // 转换 ID 为名称
  const ids = tagIds.split(',').map(id => id.trim()).filter(id => id);
  for (const id of ids) {
    const name = idToNameMap[id];
    if (name) {
      tagNames.push(name);
    } else {
      // 如果找不到，显示ID
      tagNames.push(`ID:${id}`);
    }
  }
  
  return tagNames;
}
