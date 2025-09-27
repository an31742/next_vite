# 用户初始化与数据隔离功能

## 功能概述

实现了完整的用户数据隔离机制，确保每个用户登录时都从0开始，各用户的收支数据完全独立。

## 主要特性

### 1. 用户登录初始化
- **新用户**: 自动创建用户记录，初始余额为0
- **老用户**: 显示当前真实余额
- **数据隔离**: 每个用户只能看到自己的数据

### 2. 核心接口

#### 登录接口 `/api/auth/login` (POST)
- 自动处理新用户注册
- 返回用户当前财务状态
- 新用户初始余额为0

```json
{
  "code": 200,
  "message": "登录成功！欢迎使用记账本，您的初始余额为0。",
  "data": {
    "access_token": "jwt_token",
    "user": { "id": "user_id", "nickname": "用户123456" },
    "isNewUser": true,
    "summary": {
      "totalIncome": 0,
      "totalExpense": 0,
      "balance": 0,
      "totalCount": 0
    }
  }
}
```

#### 用户重置接口 `/api/user/reset-transactions`
- **GET**: 查看当前用户交易统计
- **POST**: 重置当前用户所有交易记录为0

```bash
# 重置当前用户的交易记录
curl -X POST http://localhost:3000/api/user/reset-transactions \
  -H "Authorization: Bearer your_jwt_token"
```

#### 用户初始化接口 `/api/user/initialize`
- **GET**: 获取用户初始化状态
- **POST**: 手动初始化用户（支持强制重置）

```bash
# 强制重置用户数据
curl -X POST http://localhost:3000/api/user/initialize \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"forceReset": true}'
```

#### 管理员统计接口 `/api/admin/users-stats` (GET)
- 查看所有用户的财务状态
- 用于系统监控和管理

## 数据隔离机制

### 1. 用户ID隔离
所有查询都基于 `userId` 字段进行过滤：
```javascript
// 示例：只获取当前用户的交易记录
{
  userId: currentUser.userId,
  deletedAt: { $exists: false }
}
```

### 2. JWT认证
- 每个请求都需要有效的JWT token
- Token中包含用户唯一标识
- 自动提取用户信息进行数据过滤

### 3. 软删除机制
- 重置数据使用软删除（添加 `deletedAt` 字段）
- 数据可恢复，保证数据安全
- 不影响其他用户数据

## 使用场景

### 场景1: 新用户首次登录
```javascript
// 用户首次登录，系统自动初始化
const loginResult = await login(wechatCode);
if (loginResult.isNewUser) {
  console.log('欢迎新用户！初始余额为0');
}
```

### 场景2: 用户要求重置数据
```javascript
// 用户希望清空所有记录重新开始
await fetch('/api/user/reset-transactions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
```

### 场景3: 管理员监控
```javascript
// 管理员查看所有用户状态
const stats = await fetch('/api/admin/users-stats');
console.log(`共有 ${stats.userStats.length} 个用户`);
```

## 测试验证

运行测试脚本验证功能：
```bash
cd next-api
node test-user-initialization.js
```

## 注意事项

1. **数据安全**: 用户只能操作自己的数据
2. **初始状态**: 新用户余额始终为0
3. **数据恢复**: 软删除支持数据恢复
4. **性能优化**: 建议为 `userId` 字段添加索引
5. **监控**: 通过管理员接口监控用户状态

## 环境配置

确保以下环境变量配置正确：
```env
MONGODB_URI=mongodb+srv://...
DB_NAME=accounting_app
JWT_SECRET=your_jwt_secret
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
```