# 管理员接口 API 文档

## 概述

管理员接口提供系统管理和监控功能，包括用户管理、数据操作、系统监控等。

## 接口列表

### 1. 用户统计接口
- **路径**: `/api/admin/users-stats`
- **方法**: GET
- **描述**: 获取所有用户的统计信息

### 2. 批量初始化接口
- **路径**: `/api/admin/batch-initialize`
- **方法**: GET/POST
- **描述**: 批量初始化用户数据

### 3. 系统管理接口
- **路径**: `/api/admin/system-manage`
- **方法**: GET/POST/PUT/DELETE
- **描述**: 系统级别的管理操作

### 4. 数据导出接口
- **路径**: `/api/admin/data-export`
- **方法**: GET/POST
- **描述**: 导出系统数据

### 5. 系统监控接口
- **路径**: `/api/admin/monitor`
- **方法**: GET/POST
- **描述**: 系统性能和状态监控

## 详细接口说明

### 用户统计接口

#### GET /api/admin/users-stats
获取所有用户的统计信息

**响应示例**:
```json
{
  "code": 200,
  "message": "获取统计成功",
  "data": {
    "userStats": [
      {
        "user": {
          "id": "user123",
          "nickname": "张三",
          "createdAt": "2023-01-01T00:00:00.000Z"
        },
        "summary": {
          "income": 10000,
          "expense": 5000,
          "balance": 5000,
          "count": 50
        }
      }
    ]
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### 系统管理接口

#### GET /api/admin/system-manage
获取系统统计信息

**查询参数**:
- `action`: 操作类型 (system_stats | database_size)

**响应示例**:
```json
{
  "code": 200,
  "message": "获取系统统计成功",
  "data": {
    "collections": {
      "transactions": 1000,
      "categories": 13,
      "users": 50
    },
    "transactions": {
      "totalIncome": 500000,
      "totalExpense": 300000,
      "balance": 200000,
      "count": 1000
    },
    "totalRecords": 1063
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### POST /api/admin/system-manage
清空数据库

**请求体**:
```json
{
  "action": "clear_database"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "数据库已清空",
  "data": {
    "beforeStats": {
      "transactions": 1000,
      "categories": 13,
      "users": 50
    },
    "deletedCounts": {
      "transactions": 1000,
      "categories": 13,
      "users": 50
    },
    "totalDeleted": 1063
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### PUT /api/admin/system-manage
重置指定用户数据

**请求体**:
```json
{
  "userId": "user123",
  "resetType": "amount_only" // 或 "delete_all"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "用户 张三 数据重置成功",
  "data": {
    "userId": "user123",
    "resetType": "amount_only",
    "beforeStats": {
      "totalIncome": 10000,
      "totalExpense": 5000,
      "balance": 5000,
      "transactionCount": 50
    },
    "processedCount": 50,
    "message": "已将 50 条交易记录的金额重置为0"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### DELETE /api/admin/system-manage
删除指定用户（包括所有数据）

**查询参数**:
- `userId`: 用户ID

**响应示例**:
```json
{
  "code": 200,
  "message": "用户 张三 已删除",
  "data": {
    "userId": "user123",
    "deletedTransactions": 50,
    "message": "已删除用户及其 50 条交易记录"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### 数据导出接口

#### GET /api/admin/data-export
导出系统数据

**查询参数**:
- `type`: 导出类型 (all | users | transactions | categories | statistics)
- `format`: 导出格式 (json)

**响应示例**:
```json
{
  "code": 200,
  "message": "数据导出成功",
  "data": {
    "data": {
      "users": [...],
      "transactions": [...],
      "categories": [...]
    },
    "exportType": "all",
    "format": "json",
    "exportedAt": "2023-01-01T00:00:00.000Z"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### POST /api/admin/data-export/query
自定义查询导出

**请求体**:
```json
{
  "collection": "transactions",
  "query": {
    "userId": "user123"
  },
  "format": "json"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "集合 transactions 数据查询成功",
  "data": {
    "collection": "transactions",
    "query": {
      "userId": "user123"
    },
    "count": 50,
    "data": [...],
    "format": "json",
    "exportedAt": "2023-01-01T00:00:00.000Z"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### 系统监控接口

#### GET /api/admin/monitor
获取系统监控信息

**查询参数**:
- `action`: 操作类型 (overview | performance | users)

**响应示例**:
```json
{
  "code": 200,
  "message": "系统监控信息获取成功",
  "data": {
    "system": {
      "uptime": 3600,
      "memory": {
        "rss": 123456789,
        "heapTotal": 98765432,
        "heapUsed": 65432109,
        "external": 1234567
      },
      "cpu": {
        "user": 123456,
        "system": 789012
      },
      "platform": "darwin",
      "arch": "x64",
      "totalmem": 17179869184,
      "freemem": 8589934592
    },
    "database": {
      "status": "connected",
      "name": "accounting_app",
      "collections": {
        "users": 50,
        "transactions": 1000,
        "categories": 13
      },
      "version": "4.4.0"
    },
    "timestamp": "2023-01-01T00:00:00.000Z"
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### POST /api/admin/monitor/logs
获取系统日志

**请求体**:
```json
{
  "level": "info",
  "limit": 100,
  "startTime": "2023-01-01T00:00:00.000Z",
  "endTime": "2023-01-02T00:00:00.000Z"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "系统日志获取成功",
  "data": {
    "logs": [
      {
        "timestamp": "2023-01-01T12:00:00.000Z",
        "level": "info",
        "message": "用户登录成功",
        "service": "auth-service"
      }
    ],
    "count": 1,
    "level": "info",
    "limit": 100
  },
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## 错误响应格式

所有错误响应都遵循统一格式：

```json
{
  "code": 400,
  "message": "错误描述",
  "error": "错误代码",
  "details": "详细信息",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## 权限要求

所有管理员接口都需要有效的 JWT Token，并且用户必须具有管理员权限。

## 使用示例

### 获取用户统计
```bash
curl -X GET "http://localhost:3000/api/admin/users-stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 重置用户数据
```bash
curl -X PUT "http://localhost:3000/api/admin/system-manage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user123",
    "resetType": "amount_only"
  }'
```

### 导出数据
```bash
curl -X GET "http://localhost:3000/api/admin/data-export?type=transactions&format=json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```