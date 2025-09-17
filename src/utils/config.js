/**
 * API配置工具
 * 统一管理API地址和请求配置
 */

// 安全获取环境变量的辅助函数
const getEnv = (key, defaultValue = '') => {
  try {
    return import.meta.env[key] || defaultValue
  } catch (error) {
    return defaultValue
  }
}

// 获取API基础URL
export const getApiBaseUrl = () => {
  return getEnv('VITE_API_URL') || getEnv('VUE_APP_API_URL') || 'http://localhost:3001/api'
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
    name: getEnv('VITE_APP_NAME') || getEnv('VUE_APP_NAME') || '订单管理系统',
    version: getEnv('VITE_APP_VERSION') || getEnv('VUE_APP_VERSION') || '1.0.0',
    debug: (getEnv('VITE_APP_DEBUG') || getEnv('VUE_APP_DEBUG') || 'false') === 'true',
    enableConsoleLog: (getEnv('VITE_APP_ENABLE_CONSOLE_LOG') || getEnv('VUE_APP_ENABLE_CONSOLE_LOG') || 'true') === 'true',
    defaultPageSize: parseInt(getEnv('VITE_APP_DEFAULT_PAGE_SIZE') || getEnv('VUE_APP_DEFAULT_PAGE_SIZE') || '20'),
    maxFileSize: parseInt(getEnv('VITE_APP_MAX_FILE_SIZE') || getEnv('VUE_APP_MAX_FILE_SIZE') || '10'),
    supportedImageFormats: (getEnv('VITE_APP_SUPPORTED_IMAGE_FORMATS') || getEnv('VUE_APP_SUPPORTED_IMAGE_FORMATS') || 'jpg,jpeg,png,gif,webp').split(','),
    tokenExpireWarningTime: parseInt(getEnv('VITE_APP_TOKEN_EXPIRE_WARNING_TIME') || getEnv('VUE_APP_TOKEN_EXPIRE_WARNING_TIME') || '5')
  }
}

// 检查是否为开发环境
export const isDevelopment = () => {
  try {
    return import.meta.env.DEV || false
  } catch (error) {
    return false
  }
}

// 检查是否为生产环境
export const isProduction = () => {
  try {
    return import.meta.env.PROD || false
  } catch (error) {
    return true
  }
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