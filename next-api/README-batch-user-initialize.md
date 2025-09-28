# 批量用户初始化功能 - API文档

## 概述

批量用户初始化功能允许管理员对系统中的所有用户或指定用户进行批量初始化操作，确保用户数据符合项目规范：**新用户登录时，支出和收入必须初始化为0，确保每个用户从零开始独立记账。**

## API接口

### 1. 批量初始化预览

**GET** `/api/admin/batch-initialize`

获取批量初始化的预览信息，查看哪些用户需要初始化。

#### 请求参数
- `targetUsers` (可选): 目标用户范围
  - `all`: 所有用户（默认）
  - `new_only`: 仅新用户（无交易记录的用户）

#### 示例请求
```bash
# 预览所有用户
curl -X GET "http://localhost:3000/api/admin/batch-initialize?targetUsers=all" \
  -H "Authorization: Bearer admin_jwt_token"

# 预览新用户
curl -X GET "http://localhost:3000/api/admin/batch-initialize?targetUsers=new_only" \
  -H "Authorization: Bearer admin_jwt_token"
```

#### 响应示例
```json
{
  "code": 200,
  "message": "获取批量初始化预览成功",
  "data": {
    "previewSummary": {
      "totalUsers": 10,
      "newUsers": 3,
      "existingUsers": 7,
      "usersNeedingInitialization": 5,
      "targetUsers": "all"
    },
    "userPreviews": [
      {
        "user": {
          "id": "user_001",
          "nickname": "用户001",
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        "summary": {
          "totalIncome": 1000,
          "totalExpense": 500,
          "balance": 500,
          "transactionCount": 5
        },
        "isNewUser": false,
        "needsInitialization": true
      }
    ],
    "checkedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. 执行批量初始化

**POST** `/api/admin/batch-initialize`

执行批量用户初始化操作。

#### 请求参数
```json
{
  "targetUsers": "all",              // 目标用户: "all", "new_only", 或用户ID数组
  "initializeType": "amount_only",   // 初始化类型: "amount_only" 或 "delete_all"
  "forceReset": false                // 是否强制重置现有用户数据
}
```

#### 参数说明

**targetUsers**:
- `"all"`: 处理所有用户
- `"new_only"`: 仅处理新用户（无交易记录）
- `["user1", "user2"]`: 指定用户ID数组

**initializeType**:
- `"amount_only"`: 仅将交易金额设置为0，保留交易记录结构
- `"delete_all"`: 软删除所有交易记录（设置deletedAt字段）

**forceReset**:
- `false`: 跳过已有数据的用户（默认）
- `true`: 强制重置所有目标用户的数据

#### 示例请求

##### 仅初始化新用户
```bash
curl -X POST "http://localhost:3000/api/admin/batch-initialize" \
  -H "Authorization: Bearer admin_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUsers": "new_only",
    "initializeType": "amount_only",
    "forceReset": false
  }'
```

##### 强制重置所有用户
```bash
curl -X POST "http://localhost:3000/api/admin/batch-initialize" \
  -H "Authorization: Bearer admin_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUsers": "all",
    "initializeType": "delete_all",
    "forceReset": true
  }'
```

##### 指定用户初始化
```bash
curl -X POST "http://localhost:3000/api/admin/batch-initialize" \
  -H "Authorization: Bearer admin_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUsers": ["user_001", "user_002"],
    "initializeType": "amount_only",
    "forceReset": true
  }'
```

#### 响应示例
```json
{
  "code": 200,
  "message": "批量用户初始化完成: 成功 8 个，失败 0 个，跳过 2 个",
  "data": {
    "summary": {
      "totalUsers": 10,
      "successCount": 8,
      "errorCount": 0,
      "skippedCount": 2,
      "initializeType": "amount_only",
      "forceReset": false,
      "targetUsers": "all"
    },
    "results": [
      {
        "userId": "user_001",
        "nickname": "用户001",
        "status": "success",
        "isNewUser": false,
        "initializeType": "amount_only",
        "processedCount": 5,
        "beforeSummary": {
          "totalIncome": 1000,
          "totalExpense": 500,
          "balance": 500,
          "transactionCount": 5
        },
        "afterSummary": {
          "totalIncome": 0,
          "totalExpense": 0,
          "balance": 0,
          "transactionCount": 5
        }
      },
      {
        "userId": "user_002",
        "nickname": "用户002",
        "status": "skipped",
        "reason": "用户已有数据且未强制重置",
        "beforeSummary": {
          "totalIncome": 2000,
          "totalExpense": 1000,
          "balance": 1000,
          "transactionCount": 3
        },
        "afterSummary": {
          "totalIncome": 2000,
          "totalExpense": 1000,
          "balance": 1000,
          "transactionCount": 3
        }
      }
    ],
    "processedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

## 使用场景

### 1. 系统部署后的数据初始化
在系统首次部署或重大更新后，确保所有用户数据符合规范：

```javascript
// 初始化所有新用户，不影响现有用户
const response = await fetch('/api/admin/batch-initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUsers: 'new_only',
    initializeType: 'amount_only',
    forceReset: false
  })
});
```

### 2. 定期数据维护
定期清理和重置用户数据：

```javascript
// 每月1号强制重置所有用户为0
const response = await fetch('/api/admin/batch-initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUsers: 'all',
    initializeType: 'delete_all',
    forceReset: true
  })
});
```

### 3. 问题用户数据修复
修复特定用户的数据问题：

```javascript
// 修复特定用户的数据
const problematicUsers = ['user_001', 'user_002'];
const response = await fetch('/api/admin/batch-initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetUsers: problematicUsers,
    initializeType: 'amount_only',
    forceReset: true
  })
});
```

### 4. 开发环境数据重置
在开发或测试环境中重置所有数据：

```bash
# 开发环境完全重置
curl -X POST "http://localhost:3000/api/admin/batch-initialize" \
  -H "Authorization: Bearer dev_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUsers": "all",
    "initializeType": "delete_all", 
    "forceReset": true
  }'
```

## 安全考虑

### 1. 权限控制
- 此接口需要管理员权限
- 建议在生产环境中增加额外的权限验证
- 记录所有批量操作的日志

### 2. 操作审计
```javascript
// 建议的权限检查（需要在实际实现中添加）
function checkAdminPermission(user) {
  if (!user.roles.includes('admin')) {
    throw new Error('需要管理员权限');
  }
  
  // 记录操作日志
  console.log(`管理员 ${user.id} 执行批量初始化操作`);
}
```

### 3. 数据备份
在执行批量操作前，建议：

1. **备份数据库**
```bash
# MongoDB备份示例
mongodump --db accounting_db --out backup_$(date +%Y%m%d_%H%M%S)
```

2. **测试环境验证**
```bash
# 先在测试环境验证
curl -X GET "http://test-api/admin/batch-initialize?targetUsers=all"
```

3. **分批处理**
```javascript
// 对于大量用户，建议分批处理
const userBatches = chunk(allUsers, 100); // 每批100个用户
for (const batch of userBatches) {
  await batchInitialize(batch);
  await delay(1000); // 添加延迟避免系统压力
}
```

## 错误处理

### 常见错误码

- `400`: 参数错误
  - `INVALID_INITIALIZE_TYPE`: 初始化类型无效
  - `INVALID_TARGET_USERS`: 目标用户参数无效

- `401`: 未授权访问
  - `UNAUTHORIZED`: 需要管理员权限

- `500`: 服务器内部错误

### 错误响应示例
```json
{
  "code": 400,
  "message": "初始化类型必须是 amount_only 或 delete_all",
  "error": "INVALID_INITIALIZE_TYPE",
  "timestamp": "2024-01-15T10:40:00.000Z"
}
```

## 监控和日志

### 操作日志
系统会自动记录以下信息：
```
用户 user_001 (用户001) 初始化成功: amount_only, 处理了 5 条记录
用户 user_002 初始化失败: Error message
批量初始化完成: 成功 8 个，失败 0 个，跳过 2 个
```

### 性能监控
- 批量操作执行时间
- 数据库操作次数
- 内存使用情况

## 测试

### 运行测试脚本
```bash
# 运行批量初始化测试
node test-batch-initialize.js

# 使用真实管理员Token测试
ADMIN_TOKEN=real_admin_token node test-batch-initialize.js
```

### 测试覆盖范围
1. **预览功能测试**
   - 所有用户预览
   - 新用户预览
   - 指定用户预览

2. **批量初始化测试**
   - 仅新用户初始化
   - 强制重置所有用户
   - 指定用户初始化

3. **错误处理测试**
   - 无效参数
   - 权限验证
   - 网络错误

## 与现有功能的集成

### 配合使用的接口
- **`/api/admin/users-stats`**: 查看用户状态，确定需要初始化的用户
- **`/api/user/initialize`**: 单用户初始化，补充批量操作
- **`/api/user/verify-isolation`**: 验证初始化结果
- **`/api/monthly-reset`**: 定期重置配合使用

### 工作流程建议
1. **预览** → 查看当前用户状态
2. **备份** → 备份重要数据
3. **测试** → 在测试环境验证
4. **执行** → 生产环境批量初始化
5. **验证** → 确认初始化结果
6. **监控** → 持续监控系统状态

## 注意事项

1. **不可逆操作**: 删除类型的初始化操作不可撤销
2. **系统性能**: 大量用户初始化可能影响系统性能
3. **数据一致性**: 确保在维护窗口期间执行
4. **用户体验**: 通知用户系统维护时间

## 总结

批量用户初始化功能提供了强大的用户数据管理能力，确保系统中所有用户都符合项目规范。通过灵活的配置选项和详细的操作报告，管理员可以安全、高效地维护用户数据的一致性。