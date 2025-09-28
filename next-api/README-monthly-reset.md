# 月度重置功能 - API文档

## 概述

月度重置功能允许用户将指定月份1号的收入和支出金额设置为0，支持两种重置模式：
- **仅重置金额** (`amount_only`): 将交易记录的金额设置为0，但保留交易记录
- **删除记录** (`delete_all`): 软删除所有交易记录

根据项目规范，**新用户登录时，支出和收入必须初始化为0，确保每个用户从零开始独立记账**。

## API接口

### 1. 查看月度1号交易记录

**GET** `/api/monthly-reset`

查看指定月份1号的交易记录状态。

#### 请求参数
- `year` (可选): 年份，默认为当前年份，范围：2020-2030
- `month` (可选): 月份，默认为当前月份，范围：1-12

#### 示例请求
```bash
curl -X GET "http://localhost:3000/api/monthly-reset?year=2024&month=1" \
  -H "Authorization: Bearer your_jwt_token"
```

#### 响应示例
```json
{
  "code": 200,
  "message": "查询2024年1月1日交易记录成功",
  "data": {
    "date": "2024-01-01",
    "year": 2024,
    "month": 1,
    "transactions": [
      {
        "id": "trans_001",
        "type": "income",
        "amount": 5000,
        "categoryId": "salary",
        "note": "工资",
        "date": "2024-01-01"
      }
    ],
    "summary": {
      "totalIncome": 5000,
      "totalExpense": 1200,
      "balance": 3800,
      "count": 2
    },
    "canReset": true
  }
}
```

### 2. 重置单个月份1号记录

**POST** `/api/monthly-reset`

将指定月份1号的收入和支出设置为0。

#### 请求参数
```json
{
  "year": 2024,         // 必需：年份 (2020-2030)
  "month": 1,           // 必需：月份 (1-12)
  "resetType": "amount_only"  // 可选：重置类型，默认 "amount_only"
}
```

#### 重置类型说明
- `amount_only`: 仅将金额设置为0，保留交易记录和其他信息
- `delete_all`: 软删除所有交易记录（设置 deletedAt 字段）

#### 示例请求
```bash
# 仅重置金额
curl -X POST "http://localhost:3000/api/monthly-reset" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "month": 1,
    "resetType": "amount_only"
  }'

# 删除所有记录
curl -X POST "http://localhost:3000/api/monthly-reset" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "month": 1,
    "resetType": "delete_all"
  }'
```

#### 响应示例
```json
{
  "code": 200,
  "message": "成功将2024年1月1日的2条交易记录金额设置为0",
  "data": {
    "date": "2024-01-01",
    "year": 2024,
    "month": 1,
    "resetSummary": {
      "originalCount": 2,
      "resetCount": 2,
      "deletedCount": 0,
      "originalIncome": 5000,
      "originalExpense": 1200,
      "resetType": "amount_only"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. 批量重置多个月份

**PUT** `/api/monthly-reset`

批量重置多个月份1号的交易记录。

#### 请求参数
```json
{
  "monthlyResets": [
    { "year": 2024, "month": 1 },
    { "year": 2024, "month": 2 },
    { "year": 2024, "month": 3 }
  ],
  "resetType": "amount_only"  // 可选：重置类型，默认 "amount_only"
}
```

#### 示例请求
```bash
curl -X PUT "http://localhost:3000/api/monthly-reset" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyResets": [
      { "year": 2024, "month": 1 },
      { "year": 2024, "month": 2 },
      { "year": 2024, "month": 3 }
    ],
    "resetType": "amount_only"
  }'
```

#### 响应示例
```json
{
  "code": 200,
  "message": "批量月度重置完成：成功2个，失败0个，跳过1个",
  "data": {
    "resetType": "amount_only",
    "summary": {
      "total": 3,
      "success": 2,
      "failed": 0,
      "skipped": 1
    },
    "results": [
      {
        "year": 2024,
        "month": 1,
        "date": "2024-01-01",
        "status": "success",
        "originalCount": 2,
        "processedCount": 2,
        "resetType": "amount_only"
      },
      {
        "year": 2024,
        "month": 2,
        "date": "2024-02-01",
        "status": "success",
        "originalCount": 1,
        "processedCount": 1,
        "resetType": "amount_only"
      },
      {
        "year": 2024,
        "month": 3,
        "date": "2024-03-01",
        "status": "skipped",
        "reason": "该日期没有交易记录"
      }
    ],
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}
```

## 使用场景

### 1. 月初数据清零
在每月月初，将上个月最后累积的数据重置为0，让用户重新开始记账：

```javascript
// 重置当前月份1号的数据
const response = await fetch('/api/monthly-reset', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    resetType: 'amount_only'
  })
});
```

### 2. 年度数据清理
在年末清理所有月份1号的历史数据：

```javascript
// 清理整年的1号数据
const monthlyResets = [];
for (let month = 1; month <= 12; month++) {
  monthlyResets.push({ year: 2024, month });
}

const response = await fetch('/api/monthly-reset', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    monthlyResets,
    resetType: 'amount_only'
  })
});
```

### 3. 用户数据初始化
根据项目规范，新用户登录时需要确保收支初始化为0：

```javascript
// 用户首次登录后的数据初始化
const currentDate = new Date();
const response = await fetch('/api/monthly-reset', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    resetType: 'amount_only'
  })
});
```

## 错误处理

### 常见错误码

- `400`: 参数错误
  - `INVALID_YEAR`: 年份不在有效范围内（2020-2030）
  - `INVALID_MONTH`: 月份不在有效范围内（1-12）
  - `INVALID_RESET_TYPE`: 重置类型无效
  - `MISSING_REQUIRED_PARAMS`: 缺少必需参数

- `401`: 未授权访问
  - `UNAUTHORIZED`: JWT Token无效或过期

- `500`: 服务器内部错误

### 错误响应示例
```json
{
  "code": 400,
  "message": "年份必须在2020-2030之间",
  "error": "INVALID_YEAR",
  "timestamp": "2024-01-15T10:40:00.000Z"
}
```

## 测试

### 运行测试脚本
```bash
# 运行月度重置功能测试
node test-monthly-reset.js

# 设置自定义API地址和Token
API_BASE=http://localhost:3000/api TEST_TOKEN=your_real_jwt_token node test-monthly-reset.js
```

### 测试内容
测试脚本包含以下测试用例：

1. **基本功能测试**
   - 查看月份1号交易记录状态
   - 金额重置功能（amount_only）
   - 验证重置后的状态
   - 批量重置多个月份
   - 删除模式重置（delete_all）

2. **参数验证测试**
   - 无效年份参数
   - 无效月份参数
   - 无效重置类型
   - 缺少必需参数

## 安全考虑

1. **身份验证**: 所有接口都需要有效的JWT Token
2. **用户隔离**: 只能操作当前用户的数据
3. **软删除**: 删除操作使用软删除，数据可恢复
4. **参数验证**: 严格验证所有输入参数

## 与现有功能的集成

此功能与以下现有功能协作：

- **用户初始化** (`/api/user/initialize`): 新用户初始化时可调用月度重置
- **用户重置** (`/api/user/reset-transactions`): 全量重置与月度重置的区别
- **交易管理** (`/api/transactions`): 重置操作影响交易记录
- **统计分析** (`/api/statistics`): 重置后统计数据会相应更新

## 注意事项

1. **数据备份**: 在执行重置操作前，建议先查看当前状态
2. **操作不可逆**: 金额重置操作不可撤销（除非使用delete_all模式的软删除）
3. **并发安全**: 避免同时对同一用户执行多个重置操作
4. **性能考虑**: 批量重置大量数据时可能需要较长时间