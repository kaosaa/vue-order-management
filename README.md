# Vue报单系统 (Vue Order Submission System)

一个基于Vue 3的现代化报单管理系统，支持用户注册登录、订单管理、管理员后台等功能。

## 主要功能

### 用户功能
- 用户注册和登录（手机号验证）
- 订单创建和提交
- 历史订单查看
- 个人资料管理

### 管理员功能
- 用户管理（修改资料、启用/禁用用户）
- 商品管理（CRUD操作）
- 快递公司管理（设置单号长度要求）
- 订单管理（查看、修改用户订单）
- 数据导出（Excel格式）

### 技术特性
- 中国手机号实时验证
- 支付宝账户验证
- 快递单号格式验证
- JWT身份认证
- 角色权限控制
- Excel数据导出
- 响应式设计

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **样式**: CSS3 + Element Plus主题
- **文件导出**: XLSX + FileSaver.js

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd vue-order-system
```

2. 环境配置
```bash
# 复制环境变量配置文件
cp .env.example .env

# 编辑.env文件，配置API地址等环境变量
# VUE_APP_API_URL=http://localhost:3001/api  # 开发环境API地址
```

3. 安装依赖
```bash
npm install
# 或
yarn install
```

4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

5. 打开浏览器访问 http://localhost:3000

## 环境配置

### 前端环境变量

在项目根目录创建`.env`文件：

```env
# API服务器地址
VUE_APP_API_URL=http://localhost:3001/api

# 应用配置
VUE_APP_NAME=订单管理系统
VUE_APP_VERSION=1.0.0
VUE_APP_DEBUG=true

# 分页配置
VUE_APP_DEFAULT_PAGE_SIZE=20

# 文件上传配置
VUE_APP_MAX_FILE_SIZE=10
VUE_APP_SUPPORTED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp
```

### 生产环境部署

生产环境需要修改`.env.production`文件：

```env
VUE_APP_API_URL=https://your-api-domain.com/api
VUE_APP_DEBUG=false
VUE_APP_ENABLE_CONSOLE_LOG=false
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
vue-order-system/
├── src/
│   ├── components/          # 公共组件
│   │   └── Navigation.vue   # 导航栏组件
│   ├── stores/             # Pinia状态管理
│   │   ├── auth.js         # 认证状态
│   │   ├── admin.js        # 管理员状态
│   │   ├── order.js        # 订单状态
│   │   └── product.js      # 商品状态
│   ├── services/           # API服务
│   │   ├── api.js          # Axios配置
│   │   └── index.js        # API接口定义
│   ├── utils/              # 工具函数
│   │   ├── validation.js   # 验证工具
│   │   └── excel.js        # Excel导出工具
│   ├── views/              # 页面组件
│   │   ├── user/           # 用户页面
│   │   │   ├── UserDashboard.vue
│   │   │   ├── UserOrders.vue
│   │   │   └── UserHistory.vue
│   │   ├── admin/          # 管理员页面
│   │   │   ├── AdminDashboard.vue
│   │   │   ├── UserManagement.vue
│   │   │   ├── ProductManagement.vue
│   │   │   ├── CourierManagement.vue
│   │   │   ├── OrderManagement.vue
│   │   │   └── DataExport.vue
│   │   ├── Login.vue       # 登录页面
│   │   └── Register.vue    # 注册页面
│   ├── router/             # 路由配置
│   │   └── index.js
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── public/                 # 静态资源
├── package.json            # 项目配置
├── vite.config.js         # Vite配置
└── README.md              # 项目说明
```

## 演示账户

### 管理员账户
- 手机号: 13800138000
- 密码: admin123

### 普通用户账户
- 手机号: 13900139000
- 密码: user123

## 功能详解

### 用户注册
- 真实姓名验证（2-20字符）
- 手机号实时验证（中国大陆手机号格式）
- 支付宝账户验证（支持邮箱和手机号）
- 密码强度检查
- 重复数据检测

### 订单系统
- 商品选择和数量设置
- 快递公司选择
- 快递单号长度验证
- 订单状态管理
- 历史记录查看

### 管理员功能
- 用户CRUD操作
- 商品价格管理
- 快递公司配置
- 订单修改权限
- 数据导出功能

### 数据验证
- 中国手机号格式: 1[3-9]xxxxxxxxx
- 支付宝账户: 邮箱或手机号
- 快递单号: 根据快递公司规则验证

## API接口

### 认证相关
- POST `/api/auth/login` - 用户登录
- POST `/api/auth/register` - 用户注册
- GET `/api/auth/profile` - 获取用户信息

### 订单管理
- GET `/api/orders` - 获取订单列表
- POST `/api/orders` - 创建订单
- PUT `/api/orders/:id` - 更新订单
- DELETE `/api/orders/:id` - 删除订单

### 管理功能
- GET `/api/users` - 获取用户列表
- PUT `/api/users/:id` - 更新用户信息
- GET `/api/products` - 获取商品列表
- POST `/api/products` - 创建商品

## 开发指南

### 添加新功能
1. 在相应的store中添加状态管理
2. 创建API接口定义
3. 开发Vue组件
4. 配置路由
5. 添加权限控制

### 自定义主题
修改Element Plus主题变量来自定义界面样式：

```css
:root {
  --el-color-primary: #409eff;
  --el-color-success: #67c23a;
  --el-color-warning: #e6a23c;
  --el-color-danger: #f56c6c;
}
```

### 部署注意事项
1. 配置环境变量（API地址等）
2. 设置正确的publicPath
3. 配置服务器支持SPA路由
4. 设置HTTPS（生产环境推荐）

## 许可证

MIT License

## 技术支持

如有问题请提交Issue或联系开发团队。