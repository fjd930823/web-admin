// 过滤掉 Ant Design 的已知警告
// 这些警告不影响功能，是框架适配过程中的正常现象
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('findDOMNode') ||
        args[0].includes('Warning: findDOMNode is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string') {
      // 过滤 findDOMNode 警告
      if (
        args[0].includes('findDOMNode') ||
        args[0].includes('Warning: findDOMNode is deprecated')
      ) {
        return;
      }
      // 过滤 message/notification 静态方法警告
      if (
        args[0].includes('Static function can not consume context') ||
        args[0].includes('[antd: message]') ||
        args[0].includes('[antd: notification]')
      ) {
        return;
      }
    }
    originalWarn.call(console, ...args);
  };
}

export { };