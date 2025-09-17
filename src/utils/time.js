/**
 * 时间处理工具函数
 * 统一处理UTC时间转中国时间的问题
 */

/**
 * 将UTC时间转换为中国时间（UTC+8）
 * @param {string|Date} dateInput - 输入的日期字符串或Date对象
 * @returns {Date} 转换后的中国时间Date对象
 */
export const toChineseTime = (dateInput) => {
  if (!dateInput) return null

  let date

  if (typeof dateInput === 'string') {
    // SQLite的CURRENT_TIMESTAMP格式: "2024-01-22 14:30:22"
    // 需要将其当作UTC时间处理
    if (dateInput.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      // SQLite格式，添加UTC标识
      date = new Date(dateInput + ' UTC')
    } else if (!dateInput.includes('Z') && !dateInput.includes('+')) {
      // 其他没有时区信息的字符串，假设是UTC时间
      date = new Date(dateInput + 'Z')
    } else {
      // 已有时区信息的字符串
      date = new Date(dateInput)
    }
  } else {
    date = dateInput
  }

  return date
}

/**
 * 格式化日期为中国时间字符串（只显示日期）
 * @param {string|Date} dateInput - 输入的日期
 * @returns {string} 格式化后的日期字符串，如 "2024-01-22"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return ''

  const date = toChineseTime(dateInput)
  if (!date || isNaN(date.getTime())) return ''

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai'
  }).replace(/\//g, '-')
}

/**
 * 格式化日期时间为中国时间字符串（包含时间）
 * @param {string|Date} dateInput - 输入的日期时间
 * @returns {string} 格式化后的日期时间字符串，如 "2024-01-22 14:30:22"
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return ''

  const date = toChineseTime(dateInput)
  if (!date || isNaN(date.getTime())) return ''

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai',
    hour12: false
  })
}

/**
 * 格式化时间为简短格式（只显示时分）
 * @param {string|Date} dateInput - 输入的时间
 * @returns {string} 格式化后的时间字符串，如 "14:30"
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return ''

  const date = toChineseTime(dateInput)
  if (!date || isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
    hour12: false
  })
}

/**
 * 格式化相对时间（如：3分钟前、2小时前等）
 * @param {string|Date} dateInput - 输入的时间
 * @returns {string} 相对时间字符串
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return ''

  const date = toChineseTime(dateInput)
  if (!date || isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return '刚刚'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 30) {
    return `${diffDays}天前`
  } else {
    return formatDate(date)
  }
}

/**
 * 检查日期是否是今天
 * @param {string|Date} dateInput - 输入的日期
 * @returns {boolean} 是否是今天
 */
export const isToday = (dateInput) => {
  if (!dateInput) return false

  const date = toChineseTime(dateInput)
  if (!date || isNaN(date.getTime())) return false

  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * 获取当前中国时间
 * @returns {Date} 当前中国时间
 */
export const getCurrentChineseTime = () => {
  return new Date()
}

// 默认导出所有函数
export default {
  toChineseTime,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  isToday,
  getCurrentChineseTime
}