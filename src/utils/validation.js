// Phone number validation utilities for Chinese mobile numbers
export const phoneUtils = {
  // Chinese mobile phone number regex
  phoneRegex: /^1[3-9]\d{9}$/,
  
  // Validate Chinese mobile phone number
  isValidPhone: (phone) => {
    if (!phone || typeof phone !== 'string') return false
    return phoneUtils.phoneRegex.test(phone.trim())
  },
  
  // Format phone number for display (add spaces)
  formatPhone: (phone) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
    }
    return phone
  },
  
  // Clean phone number (remove all non-digits)
  cleanPhone: (phone) => {
    if (!phone) return ''
    return phone.replace(/\D/g, '')
  },
  
  // Get phone number carrier (basic detection)
  getCarrier: (phone) => {
    if (!phoneUtils.isValidPhone(phone)) return '未知'
    
    const prefix = phone.slice(0, 3)
    const carrierMap = {
      '134': '中国移动', '135': '中国移动', '136': '中国移动', '137': '中国移动',
      '138': '中国移动', '139': '中国移动', '147': '中国移动', '150': '中国移动',
      '151': '中国移动', '152': '中国移动', '157': '中国移动', '158': '中国移动',
      '159': '中国移动', '172': '中国移动', '178': '中国移动', '182': '中国移动',
      '183': '中国移动', '184': '中国移动', '187': '中国移动', '188': '中国移动',
      '198': '中国移动',
      
      '130': '中国联通', '131': '中国联通', '132': '中国联通', '145': '中国联通',
      '155': '中国联通', '156': '中国联通', '166': '中国联通', '171': '中国联通',
      '175': '中国联通', '176': '中国联通', '185': '中国联通', '186': '中国联通',
      
      '133': '中国电信', '149': '中国电信', '153': '中国电信', '173': '中国电信',
      '177': '中国电信', '180': '中国电信', '181': '中国电信', '189': '中国电信',
      '199': '中国电信'
    }
    
    return carrierMap[prefix] || '其他'
  }
}

// Alipay account validation utilities
export const alipayUtils = {
  // Email regex
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Validate Alipay account (can be email or phone)
  isValidAlipayAccount: (account) => {
    if (!account || typeof account !== 'string') return false
    
    const cleaned = account.trim().toLowerCase()
    
    // Check if it's a valid email
    if (alipayUtils.emailRegex.test(cleaned)) return true
    
    // Check if it's a valid phone number
    if (phoneUtils.isValidPhone(cleaned)) return true
    
    return false
  },
  
  // Get account type (email or phone)
  getAccountType: (account) => {
    if (!account) return 'unknown'
    
    const cleaned = account.trim()
    
    if (alipayUtils.emailRegex.test(cleaned)) return 'email'
    if (phoneUtils.isValidPhone(cleaned)) return 'phone'
    
    return 'unknown'
  },
  
  // Mask Alipay account for security display
  maskAccount: (account) => {
    if (!account) return ''
    
    const type = alipayUtils.getAccountType(account)
    
    if (type === 'email') {
      const [localPart, domain] = account.split('@')
      if (localPart.length <= 2) return account
      return `${localPart.slice(0, 2)}***@${domain}`
    }
    
    if (type === 'phone') {
      return `${account.slice(0, 3)}****${account.slice(-4)}`
    }
    
    return account
  }
}

// Name validation utilities
export const nameUtils = {
  // Chinese name regex (supports Chinese characters, letters, and some punctuation)
  nameRegex: /^[\u4e00-\u9fa5a-zA-Z·\s]{2,20}$/,
  
  // Validate real name
  isValidName: (name) => {
    if (!name || typeof name !== 'string') return false
    const trimmed = name.trim()
    return trimmed.length >= 2 && trimmed.length <= 20 && nameUtils.nameRegex.test(trimmed)
  },
  
  // Clean name (remove extra spaces)
  cleanName: (name) => {
    if (!name) return ''
    return name.trim().replace(/\s+/g, ' ')
  }
}

// Password validation utilities
export const passwordUtils = {
  // Minimum password requirements
  minLength: 6,
  maxLength: 32,
  
  // Validate password strength
  validatePassword: (password) => {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: '密码不能为空' }
    }
    
    if (password.length < passwordUtils.minLength) {
      return { valid: false, message: `密码长度不能少于${passwordUtils.minLength}位` }
    }
    
    if (password.length > passwordUtils.maxLength) {
      return { valid: false, message: `密码长度不能超过${passwordUtils.maxLength}位` }
    }
    
    return { valid: true, message: '密码格式正确' }
  },
  
  // Check password strength
  getPasswordStrength: (password) => {
    if (!password) return 0
    
    let score = 0
    
    // Length bonus
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 1
    
    return Math.min(score, 5)
  },
  
  // Get strength description
  getStrengthText: (strength) => {
    const strengthMap = {
      0: '极弱',
      1: '很弱',
      2: '弱',
      3: '中等',
      4: '强',
      5: '很强'
    }
    return strengthMap[strength] || '未知'
  }
}

// Tracking number validation utilities
export const trackingUtils = {
  // Courier tracking number rules
  courierRules: {
    1: { name: '顺丰速递', length: 12, pattern: /^SF\d{10}$/ },
    2: { name: '圆通速递', length: 10, pattern: /^\d{10}$/ },
    3: { name: '申通快递', length: 12, pattern: /^\d{12}$/ },
    4: { name: '中通快递', length: 12, pattern: /^\d{12}$/ },
    5: { name: '韵达快递', length: 13, pattern: /^\d{13}$/ },
    6: { name: '百世汇通', length: 11, pattern: /^\d{11}$/ },
    7: { name: '京东物流', length: 15, pattern: /^JD\d{13}$/ },
    8: { name: '邮政EMS', length: 13, pattern: /^E[A-Z]\d{9}[A-Z]{2}$/ }
  },
  
  // Validate tracking number for specific courier
  validateTrackingNumber: (courierId, trackingNumber) => {
    if (!trackingNumber || typeof trackingNumber !== 'string') return false
    
    const rule = trackingUtils.courierRules[courierId]
    if (!rule) return false
    
    const cleaned = trackingNumber.trim().toUpperCase()
    
    return cleaned.length === rule.length && rule.pattern.test(cleaned)
  },
  
  // Get courier rule by ID
  getCourierRule: (courierId) => {
    return trackingUtils.courierRules[courierId] || null
  },
  
  // Format tracking number
  formatTrackingNumber: (trackingNumber) => {
    if (!trackingNumber) return ''
    return trackingNumber.trim().toUpperCase()
  }
}

// General form validation utilities
export const formUtils = {
  // Remove extra whitespace from form data
  cleanFormData: (data) => {
    const cleaned = {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        cleaned[key] = value.trim()
      } else {
        cleaned[key] = value
      }
    }
    return cleaned
  },
  
  // Check if form has changes
  hasChanges: (original, current) => {
    const cleanOriginal = formUtils.cleanFormData(original)
    const cleanCurrent = formUtils.cleanFormData(current)
    
    return JSON.stringify(cleanOriginal) !== JSON.stringify(cleanCurrent)
  },
  
  // Validate required fields
  validateRequired: (data, requiredFields) => {
    const errors = {}
    
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        errors[field] = '此字段为必填项'
      }
    }
    
    return errors
  }
}

// Export all validation utilities
export default {
  phone: phoneUtils,
  alipay: alipayUtils,
  name: nameUtils,
  password: passwordUtils,
  tracking: trackingUtils,
  form: formUtils
}