const { body, query, param, validationResult } = require('express-validator')

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }))
    
    return res.status(400).json({
      error: '数据验证失败',
      details: errorMessages
    })
  }
  
  next()
}

// Common validation rules
const phoneValidation = body('phone')
  .isLength({ min: 11, max: 11 })
  .withMessage('手机号必须为11位数字')
  .matches(/^1[3-9]\d{9}$/)
  .withMessage('请输入正确的手机号格式')

const passwordValidation = body('password')
  .isLength({ min: 6, max: 32 })
  .withMessage('密码长度必须在6-32位之间')
  .not().isEmpty()
  .withMessage('密码不能为空')

const nameValidation = body('real_name')
  .isLength({ min: 2, max: 20 })
  .withMessage('姓名长度必须在2-20位之间')
  .matches(/^[\u4e00-\u9fa5a-zA-Z·\s]{2,20}$/)
  .withMessage('请输入正确的姓名格式')

const alipayValidation = body('alipay_account')
  .custom((value) => {
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // Check phone format
    const phoneRegex = /^1[3-9]\d{9}$/
    
    if (!emailRegex.test(value) && !phoneRegex.test(value)) {
      throw new Error('支付宝账户必须是邮箱或手机号格式')
    }
    
    return true
  })

// Validation rules for different endpoints
const validationRules = {
  // Handle validation errors
  handleValidation,
  
  // User registration validation
  register: [
    nameValidation,
    phoneValidation,
    alipayValidation,
    passwordValidation,
    handleValidation
  ],
  
  // User login validation
  login: [
    phoneValidation,
    body('password')
      .not().isEmpty()
      .withMessage('密码不能为空'),
    handleValidation
  ],
  
  // Update user profile validation
  updateProfile: [
    nameValidation.optional(),
    body('alipay_account').optional().custom((value) => {
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const phoneRegex = /^1[3-9]\d{9}$/
        
        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
          throw new Error('支付宝账户必须是邮箱或手机号格式')
        }
      }
      return true
    }),
    handleValidation
  ],
  
  // Product validation
  createProduct: [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('商品名称长度必须在1-100字符之间')
      .not().isEmpty()
      .withMessage('商品名称不能为空'),
    body('price')
      .isFloat({ min: 0.01, max: 99999.99 })
      .withMessage('商品价格必须在0.01-99999.99之间'),
    handleValidation
  ],
  
  updateProduct: [
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('商品名称长度必须在1-100字符之间'),
    body('price')
      .optional()
      .isFloat({ min: 0.01, max: 99999.99 })
      .withMessage('商品价格必须在0.01-99999.99之间'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('状态只能是active或inactive'),
    handleValidation
  ],
  
  // Courier validation
  createCourier: [
    body('name')
      .isLength({ min: 1, max: 50 })
      .withMessage('快递公司名称长度必须在1-50字符之间')
      .not().isEmpty()
      .withMessage('快递公司名称不能为空'),
    body('tracking_length')
      .isInt({ min: 6, max: 20 })
      .withMessage('快递单号长度必须在6-20位之间'),
    body('tracking_pattern')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('快递单号规则长度不能超过100字符'),
    handleValidation
  ],
  
  updateCourier: [
    body('name')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('快递公司名称长度必须在1-50字符之间'),
    body('tracking_length')
      .optional()
      .isInt({ min: 6, max: 20 })
      .withMessage('快递单号长度必须在6-20位之间'),
    body('tracking_pattern')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('快递单号规则长度不能超过100字符'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('状态只能是active或inactive'),
    handleValidation
  ],
  
  // Order validation
  createOrder: [
    body('product_id')
      .isInt({ min: 1 })
      .withMessage('商品ID必须是正整数'),
    body('courier_id')
      .isInt({ min: 1 })
      .withMessage('快递公司ID必须是正整数'),
    body('quantity')
      .isInt({ min: 1, max: 999 })
      .withMessage('数量必须在1-999之间'),
    body('tracking_number')
      .isLength({ min: 5, max: 50 })
      .withMessage('快递单号长度必须在5-50字符之间')
      .not().isEmpty()
      .withMessage('快递单号不能为空'),
    body('notes')
      .optional()
      .isLength({ max: 200 })
      .withMessage('备注信息不能超过200字符'),
    handleValidation
  ],

  updateOrder: [
    body('status')
      .optional()
      .isIn(['pending', 'processing', 'completed', 'cancelled'])
      .withMessage('订单状态只能是pending(待处理), processing(待结算), completed(已完成)或cancelled(已作废)'),
    body('tracking_number')
      .optional()
      .isLength({ min: 5, max: 50 })
      .withMessage('快递单号长度必须在5-50字符之间'),
    body('notes')
      .optional()
      .isLength({ max: 200 })
      .withMessage('备注信息不能超过200字符'),
    handleValidation
  ],

  // ID parameter validation
  validateId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID必须是正整数'),
    handleValidation
  ],
  
  // Pagination validation
  validatePagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    query('sort')
      .optional()
      .isIn(['id', 'created_at', 'updated_at', 'name', 'phone', 'status'])
      .withMessage('排序字段不正确'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('排序方向只能是asc或desc'),
    handleValidation
  ],
  
  // Search validation
  validateSearch: [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('搜索关键词长度必须在1-100字符之间'),
    handleValidation
  ]
}

module.exports = { ...validationRules, handleValidation }