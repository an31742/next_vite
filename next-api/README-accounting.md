# 记账小程序 API 文档

## 项目概述

这是一个基于 Next.js 开发的记账小程序后端 API，支持微信小程序登录、交易记录管理、统计分析、分类管理和数据同步等功能。

## 技术栈

- **框架**: Next.js 14
- **数据库**: MongoDB
- **认证**: JWT
- **语言**: TypeScript

## 快速开始

### 1. 环境配置

```bash
# 复制环境变量文件
cp .env.example .env.local

# 编辑环境变量
vim .env.local
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| MONGODB_URI | MongoDB 连接字符串 | mongodb://localhost:27017 |
| DB_NAME | 数据库名称 | accounting_app |
| JWT_SECRET | JWT 签名密钥 | your_jwt_secret_key |
| WECHAT_APP_ID | 微信小程序 AppID | wx1234567890abcdef |
| WECHAT_APP_SECRET | 微信小程序 AppSecret | your_wechat_app_secret |

## API 接口列表

### 用户认证模块

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新 Token

### 交易记录模块

- `GET /api/transactions` - 获取交易记录列表
- `POST /api/transactions` - 创建交易记录
- `GET /api/transactions/[id]` - 获取交易记录详情
- `PUT /api/transactions/[id]` - 更新交易记录
- `DELETE /api/transactions/[id]` - 删除交易记录

### 统计分析模块

- `GET /api/statistics/monthly` - 获取月度统计
- `GET /api/statistics/yearly` - 获取年度统计
- `GET /api/statistics/range` - 获取日期范围统计

### 分类管理模块

- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建自定义分类

### 数据同步模块

- `POST /api/sync/transactions` - 批量上传交易记录
- `GET /api/sync/incremental` - 获取增量数据

## 数据库设计

### 用户表 (users)
```typescript
interface User {
  id: string;
  openid: string;
  unionid?: string;
  nickname?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 交易记录表 (transactions)
```typescript
interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // 软删除
}
```

### 分类表 (categories)
```typescript
interface Category {
  id: string;
  type: 'income' | 'expense';
  name: string;
  icon?: string;
  color?: string;
  sort: number;
  isSystem: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 认证说明

API 使用 JWT 进行身份认证，请在请求头中携带：

```http
Authorization: Bearer {access_token}
```

## 错误处理

API 统一返回格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-09-27T16:30:00.000Z"
}
```

错误响应格式：

```json
{
  "code": 400,
  "message": "error message",
  "error": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-09-27T16:30:00.000Z"
}
```

## 默认分类

系统会自动初始化以下默认分类：

**收入分类**:
- 工资 💰
- 奖金 🎁
- 投资收益 📈
- 其他收入 💵

**支出分类**:
- 餐饮 🍽️
- 交通 🚗
- 购物 🛒
- 娱乐 🎬
- 医疗 🏥
- 教育 📚
- 住房 🏠
- 水电费 💡
- 其他支出 💸

## 部署说明

### 1. 构建项目

```bash
npm run build
```

### 2. 启动生产服务器

```bash
npm start
```

### 3. 环境要求

- Node.js >= 18
- MongoDB >= 4.4

## 开发注意事项

1. 所有接口都有适当的错误处理
2. 使用软删除策略，删除的数据不会真正删除
3. 支持分页查询，默认每页20条记录
4. 所有金额使用数字类型，保留2位小数
5. 日期格式统一使用 YYYY-MM-DD
6. 支持按分类、日期范围、关键词筛选交易记录

## 测试

```bash
# 运行测试
npm test

# 运行测试并监听文件变化
npm run test:watch
```

## 许可证

MIT License