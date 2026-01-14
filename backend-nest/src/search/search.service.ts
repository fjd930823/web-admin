import { Injectable, Logger } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import axios from 'axios';
import { Response } from 'express';
import * as cheerio from 'cheerio';

// 豆瓣搜索结果接口
export interface DoubanSearchItem {
  cover_url: string;       // 封面图
  title: string;           // 标题
  rating: {
    value: number;         // 评分
    count: number;         // 评分人数
    star_count: number;    // 星级
  };
  year: string;            // 年份
  card_subtitle: string;   // 副标题
  id: string;              // ID
  uri: string;             // URI
  type_name?: string;      // 类型名称（电影、图书等）
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  /**
   * 搜索豆瓣电影/图书等内容
   */
  async search(searchDto: SearchDto) {
    const { keyword } = searchDto;

    if (!keyword || !keyword.trim()) {
      return {
        success: false,
        data: [],
        total: 0,
        message: '请输入搜索关键词',
      };
    }

    try {
      // 调用豆瓣移动端搜索API
      const response = await axios.get(
        'https://m.douban.com/rexxar/api/v2/search',
        {
          params: {
            q: keyword,
            type: '',
            loc_id: '',
            start: 0,
            count: 10,
            sort: 'relevance',
          },
          timeout: 10000, // 10秒超时
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
            Referer: 'https://m.douban.com/',
          },
        },
      );

      // 解析豆瓣返回的数据结构
      const subjectsData = response.data?.subjects;
      const rawItems = subjectsData?.items || [];

      // 提取并转换数据
      const results: DoubanSearchItem[] = rawItems.map((item: any) => ({
        cover_url: item.target?.cover_url || '',
        title: item.target?.title || '',
        rating: {
          value: item.target?.rating?.value || 0,
          count: item.target?.rating?.count || 0,
          star_count: item.target?.rating?.star_count || 0,
        },
        year: item.target?.year || '',
        card_subtitle: item.target?.card_subtitle || '',
        id: item.target?.id || item.target_id || '',
        uri: item.target?.uri || '',
        type_name: item.type_name || '',
      }));

      this.logger.log(
        `搜索关键词 "${keyword}"，找到 ${results.length} 条结果`,
      );

      return {
        success: true,
        data: results,
        total: subjectsData?.items?.length || 0,
        message: `找到 ${results.length} 条关于 "${keyword}" 的结果`,
      };
    } catch (error) {
      this.logger.error(`搜索豆瓣失败: ${error.message}`, error.stack);

      // 如果豆瓣API失败，返回空结果而不是抛出错误
      return {
        success: false,
        data: [],
        total: 0,
        message: '搜索失败，请稍后重试',
        error: error.message,
      };
    }
  }

  /**
   * 代理豆瓣图片请求，解决403问题
   */
  async proxyImage(imageUrl: string, res: Response) {
    if (!imageUrl) {
      return res.status(400).send('Missing image URL');
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          Referer: 'https://m.douban.com/',
        },
      });

      // 设置响应头
      res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400'); // 缓存1天
      res.send(response.data);
    } catch (error) {
      this.logger.error(`代理图片失败: ${error.message}`);
      res.status(500).send('Failed to load image');
    }
  }

  /**
   * 获取豆瓣电影详情
   */
  async getMovieDetail(id: string) {
    this.logger.log(`开始获取电影详情: ${id}`);
    
    if (!id) {
      return {
        success: false,
        message: '缺少电影ID',
        data: null,
      };
    }

    try {
      const url = `https://movie.douban.com/subject/${id}/`;
      this.logger.log(`请求URL: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 15000, // 增加到15秒
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Referer: 'https://movie.douban.com/',
        },
      });

      this.logger.log(`请求成功，状态码: ${response.status}`);
      
      const html = response.data;
      const $ = cheerio.load(html);

      // 提取 ld+json 数据
      const ldJsonScript = $('script[type="application/ld+json"]').html();
      let ldJsonData: any = {};

      if (ldJsonScript) {
        try {
          ldJsonData = JSON.parse(ldJsonScript);
        } catch (e) {
          this.logger.error('解析 ld+json 失败');
        }
      }

      // 提取其他页面信息
      const infoDiv = $('#info');
      const country = infoDiv
        .text()
        .match(/制片国家\/地区:\s*([^\n]+)/)?.[1]
        ?.trim();
      const language = infoDiv
        .text()
        .match(/语言:\s*([^\n]+)/)?.[1]
        ?.trim();
      const aka = infoDiv
        .text()
        .match(/又名:\s*([^\n]+)/)?.[1]
        ?.trim();

      // 处理时长格式
      let durationText = '';
      if (ldJsonData.duration) {
        const duration = ldJsonData.duration.replace('PT', '');
        durationText = duration
          .replace(/(\d+)H/g, '$1小时')
          .replace(/(\d+)M/g, '$1分钟');
      }

      // 构建返回数据
      const detail = {
        name: ldJsonData.name || '',
        datePublished: ldJsonData.datePublished || '',
        director:
          ldJsonData.director?.map((d: any) => d.name).join(' / ') || '',
        author: ldJsonData.author?.map((a: any) => a.name).join(' / ') || '',
        actor: ldJsonData.actor?.map((a: any) => a.name).join(' / ') || '',
        genre: ldJsonData.genre?.join(' / ') || '',
        country: country || '',
        language: language || '',
        duration: durationText,
        aka: aka || '',
        rating: ldJsonData.aggregateRating?.ratingValue || '',
        ratingCount: ldJsonData.aggregateRating?.ratingCount || '',
        description: ldJsonData.description || '',
        image: ldJsonData.image || '',
      };

      this.logger.log(`获取电影详情成功: ${id} - ${detail.name}`);

      return {
        success: true,
        data: detail,
      };
    } catch (error) {
      this.logger.error(`获取电影详情失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: '获取详情失败: ' + error.message,
        data: null,
        error: error.message,
      };
    }
  }
}
