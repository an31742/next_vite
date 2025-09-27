# 按日期修改交易记录 API 文档

## 概述

该接口允许您按日期对交易记录进行批量操作，包括获取、修改、替换和删除指定日期的所有交易记录。

**接口路径**: `/api/transactions/date/[date]`

**认证要求**: 需要有效的 JWT Token

## API 详情

### 1. 获取指定日期的交易记录

**请求方式**: `GET`

**路径**: `/api/transactions/date/{date}`

**参数**:
- `date` (路径参数): 日期，格式为 `YYYY-MM-DD`

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/transactions/date/2024-01-15" \
  -H "Authorization: Bearer your_jwt_token"
```

**响应示例**:
```json
{
  "code": 200,
  "message": "获取 2024-01-15 的交易记录成功",
  "data": {
    "date": "2024-01-15",
    "transactions": [
      {
        "id": "trans_001",
        "type": "expense",
        "amount": 50.0,
        "categoryId": "food",
        "note": "午餐费用",
        "date": "2024-01-15",
        "category": {
          "id": "food",
          "name": "餐饮",
          "icon": "🍽️",
          "color": "#FF6B6B"
        },
        "createdAt": "2024-01-15T12:30:00.000Z",
        "updatedAt": "2024-01-15T12:30:00.000Z"
      }
    ],
    "summary": {
      "totalIncome": 1000.0,
      "totalExpense": 150.0,
      "balance": 850.0,
      "count": 3
    }
  }
}
```

### 2. 批量修改指定日期的交易记录

**请求方式**: `PUT`

**路径**: `/api/transactions/date/{date}`

**请求体参数**:
```typescript
{
  transactions: (UpdateTransactionRequest & { id?: string })[],
  updateType: 'modify' | 'replace' | 'addToDate'
}
```

#### 2.1 修改现有记录 (`updateType: 'modify'`)

修改指定日期的现有交易记录。每条记录必须包含 `id` 字段。

**请求示例**:
```bash
curl -X PUT "http://localhost:3000/api/transactions/date/2024-01-15" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "updateType": "modify",
    "transactions": [
      {
        "id": "trans_001",
        "amount": 60.0,
        "note": "午餐费用 - 已修改"
      },
      {
        "id": "trans_002",
        "categoryId": "entertainment"
      }
    ]
  }'
```

#### 2.2 替换当日所有记录 (`updateType: 'replace'`)

删除指定日期的所有现有记录，然后添加新的记录。

**请求示例**:
```bash
curl -X PUT "http://localhost:3000/api/transactions/date/2024-01-15" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "updateType": "replace",
    "transactions": [
      {
        "type": "expense",
        "amount": 25.0,
        "categoryId": "transport",
        "note": "地铁费用"
      },
      {
        "type": "income",
        "amount": 500.0,
        "categoryId": "salary",
        "note": "奖金"
      }
    ]
  }'
```

#### 2.3 添加到指定日期 (`updateType: 'addToDate'`)

在指定日期添加新的交易记录，不影响现有记录。

**请求示例**:
```bash
curl -X PUT "http://localhost:3000/api/transactions/date/2024-01-15" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "updateType": "addToDate",
    "transactions": [
      {
        "type": "expense",
        "amount": 30.0,
        "categoryId": "shopping",
        "note": "购买日用品"
      }
    ]
  }'
```

**响应示例**:
```json
{
  "code": 200,
  "message": "2024-01-15 的交易记录批量更新成功",
  "data": {
    "updateType": "modify",
    "results": [
      {
        "action": "updated",
        "id": "trans_001"
      },
      {
        "action": "updated", 
        "id": "trans_002"
      }
    ],
    "updatedCount": 2,
    "date": "2024-01-15"
  }
}
```

### 3. 删除指定日期的所有交易记录

**请求方式**: `DELETE`

**路径**: `/api/transactions/date/{date}`

**请求示例**:
```bash
curl -X DELETE "http://localhost:3000/api/transactions/date/2024-01-15" \
  -H "Authorization: Bearer your_jwt_token"
```

**响应示例**:
```json
{
  "code": 200,
  "message": "成功删除 2024-01-15 的所有交易记录",
  "data": {
    "date": "2024-01-15",
    "deletedCount": 3
  }
}
```

## 数据类型定义

### UpdateTransactionRequest
```typescript
interface UpdateTransactionRequest {
  type?: 'income' | 'expense';
  amount?: number;
  categoryId?: string;
  note?: string;
  date?: string;
}
```

### BatchUpdateResult
```typescript
interface BatchUpdateResult {
  action: 'created' | 'updated' | 'skipped' | 'failed';
  id: string;
  reason?: string;
}
```

## 使用场景

### 场景1: 日记账本管理
用户可以按日期查看和编辑某一天的所有收支记录。

```javascript
// 获取今天的记录
const today = new Date().toISOString().split('T')[0];
const response = await fetch(`/api/transactions/date/${today}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 场景2: 批量数据导入
从其他系统导入某一天的交易数据。

```javascript
// 导入Excel数据到指定日期
const importData = {
  updateType: 'replace',
  transactions: excelData.map(row => ({
    type: row.type,
    amount: parseFloat(row.amount),
    categoryId: row.categoryId,
    note: row.description
  }))
};

await fetch(`/api/transactions/date/${targetDate}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(importData)
});
```

### 场景3: 数据校正
发现某天的数据有误，需要批量修正。

```javascript
// 修正某天的所有金额（例如汇率换算）
const corrections = currentTransactions.map(t => ({
  id: t.id,
  amount: t.amount * exchangeRate
}));

await fetch(`/api/transactions/date/${date}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    updateType: 'modify',
    transactions: corrections
  })
});
```

### 场景4: 日报表生成
生成某天的收支报表。

```javascript
// 获取日报表数据
const response = await fetch(`/api/transactions/date/${reportDate}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { summary, transactions } = response.data;
// 生成报表...
```

## 错误处理

### 常见错误码

- `400` - 日期格式错误或请求参数无效
- `401` - 未授权访问（Token无效或过期）
- `404` - 指定日期无数据
- `422` - 数据验证失败（金额、分类等）
- `500` - 服务器内部错误

### 错误响应示例

```json
{
  "code": 400,
  "message": "日期格式错误，请使用 YYYY-MM-DD 格式",
  "error": "INVALID_DATE_FORMAT",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 注意事项

1. **日期格式**: 必须使用 `YYYY-MM-DD` 格式
2. **时区处理**: 所有日期都按用户时区处理
3. **软删除**: 删除操作使用软删除，数据可恢复
4. **批量限制**: 单次操作建议不超过100条记录
5. **事务性**: 批量操作在失败时会回滚
6. **权限控制**: 只能操作当前用户的数据

## 性能优化建议

1. **分页处理**: 大量数据时建议分页获取
2. **缓存策略**: 可缓存常用日期的数据
3. **异步处理**: 大批量操作建议使用异步队列
4. **索引优化**: 确保日期和用户ID字段有适当索引