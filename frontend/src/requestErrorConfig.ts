import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message, notification } from 'antd';

enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

interface ResponseStructure {
  success: boolean;
  data: any;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res: any) => {
      const { success, data, errorCode, errorMessage, message: msg, showType } = res;
      if (!success) {
        // 优先使用 message，其次 errorMessage
        const errMsg = msg || errorMessage || '请求失败';
        const error: any = new Error(errMsg);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage: errMsg, showType, data };
        throw error;
      }
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                description: errorMessage,
                message: errorCode,
              });
              break;
            case ErrorShowType.REDIRECT:
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        message.error(`请求错误 ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        message.error('网络异常，无法连接服务器');
      } else {
        message.error('请求配置出错');
      }
    },
  },
  requestInterceptors: [
    (config: RequestOptions) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
  ],
  responseInterceptors: [
    (response) => {
      // errorThrower 会自动处理 success: false 的情况
      // 这里不需要额外处理
      return response;
    },
  ],
};