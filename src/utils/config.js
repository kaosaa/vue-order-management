/**
 * API配置工具
 * 统一管理API地址和请求配置
 */

// 获取API基础URL
export const getApiBaseUrl = () => {
  return import.meta.env.VUE_APP_API_URL || process.env.VUE_APP_API_URL || 'http://localhost:3001/api'
}

// 获取完整的API URL
export const getApiUrl = (path = '') => {
  const baseUrl = getApiBaseUrl()
  // 确保path以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

// 获取应用配置
export const getAppConfig = () => {
  return {
    name: import.meta.env.VUE_APP_NAME || process.env.VUE_APP_NAME || '订单管理系统',
    version: import.meta.env.VUE_APP_VERSION || process.env.VUE_APP_VERSION || '1.0.0',
    debug: (import.meta.env.VUE_APP_DEBUG || process.env.VUE_APP_DEBUG || 'false') === 'true',
    enableConsoleLog: (import.meta.env.VUE_APP_ENABLE_CONSOLE_LOG || process.env.VUE_APP_ENABLE_CONSOLE_LOG || 'false') === 'true',
    defaultPageSize: parseInt(import.meta.env.VUE_APP_DEFAULT_PAGE_SIZE || process.env.VUE_APP_DEFAULT_PAGE_SIZE || '20'),
    maxFileSize: parseInt(import.meta.env.VUE_APP_MAX_FILE_SIZE || process.env.VUE_APP_MAX_FILE_SIZE || '10'),
    supportedImageFormats: (import.meta.env.VUE_APP_SUPPORTED_IMAGE_FORMATS || process.env.VUE_APP_SUPPORTED_IMAGE_FORMATS || 'jpg,jpeg,png,gif,webp').split(','),
    tokenExpireWarningTime: parseInt(import.meta.env.VUE_APP_TOKEN_EXPIRE_WARNING_TIME || process.env.VUE_APP_TOKEN_EXPIRE_WARNING_TIME || '5')
  }
}

// 检查是否为开发环境
export const isDevelopment = () => {
  return import.meta.env.DEV || process.env.NODE_ENV === 'development'
}

// 检查是否为生产环境
export const isProduction = () => {
  return import.meta.env.PROD || process.env.NODE_ENV === 'production'
}

// 控制台日志工具（根据环境配置）
export const logger = {
  debug: (...args) => {
    const config = getAppConfig()
    if (config.debug && config.enableConsoleLog) {
      console.log('[DEBUG]', ...args)
    }
  },
  info: (...args) => {
    const config = getAppConfig()
    if (config.enableConsoleLog) {
      console.info('[INFO]', ...args)
    }
  },
  warn: (...args) => {
    const config = getAppConfig()
    if (config.enableConsoleLog) {
      console.warn('[WARN]', ...args)
    }
  },
  error: (...args) => {
    const config = getAppConfig()
    if (config.enableConsoleLog) {
      console.error('[ERROR]', ...args)
    }
  }
}

// 默认导出
export default {
  getApiBaseUrl,
  getApiUrl,
  getAppConfig,
  isDevelopment,
  isProduction,
  logger
}