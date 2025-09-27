# 记账本数据库清空与初始化功能

本文档描述如何清空记账本数据库的原始数据并重新初始化必要的默认数据。

## 功能概述

项目提供了两个主要的API接口来管理数据库数据：

1. **清空数据库**: `/api/clear-data` - 完全清空所有记账相关数据
2. **初始化数据**: `/api/init-data` - 清空数据后重新初始化默认分类

## API 接口详情

### 1. 清空数据库 - `/api/clear-data`

#### GET - 查看数据库状态
```bash
curl -X GET http://localhost:3000/api/clear-data
```

**响应示例**:
```json
{
  "code": 200,
  "message": "数据库统计信息",
  "data": {
    "collections": {
      "transactions": 150,
      "categories": 13,
      "users": 5,
      "syncLogs": 20
    },
    "totalRecords": 188
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST - 清空所有数据
```bash
curl -X POST http://localhost:3000/api/clear-data \
  -H "Content-Type: application/json"
```

**响应示例**:
```json
{
  "code": 200,
  "message": "记账本数据库已完全清空",
  "data": {
    "deletedCounts": {
      "transactions": 150,
      "categories": 13,
      "users": 5,
      "syncLogs": 20
    },
    "totalDeleted": 188
  },
  "timestamp": "2024-01-15T10:31:00.000Z"
}
```

### 2. 初始化数据 - `/api/init-data`

#### POST - 清空并重新初始化
```bash
curl -X POST http://localhost:3000/api/init-data \
  -H "Content-Type: application/json"
```

**响应示例**:
```json
{
  "code": 200,
  "message": "记账本数据库清空并初始化成功",
  "data": {
    "clearedCollections": [
      "transactions",
      "categories", 
      "users",
      "sync_logs"
    ],
    "initializedCategories": 13
  },
  "timestamp": "2024-01-15T10:32:00.000Z"
}
```

## 数据库集合说明

清空操作会影响以下MongoDB集合：

- **transactions**: 交易记录（收入/支出记录）
- **categories**: 分类数据（收入分类和支出分类）
- **users**: 用户数据（微信用户信息）
- **sync_logs**: 同步日志（数据同步记录）

## 默认分类数据

初始化后会自动创建以下默认分类：

### 收入分类
- 💰 工资
- 🎁 奖金  
- 📈 投资收益
- 💵 其他收入

### 支出分类
- 🍽️ 餐饮
- 🚗 交通
- 🛒 购物
- 🎬 娱乐
- 🏥 医疗
- 📚 教育
- 🏠 住房
- 💡 水电费
- 💸 其他支出

## 使用场景

### 场景1: 完全重置系统
当需要完全重置系统，清空所有用户数据和交易记录时：

```bash
# 1. 先查看当前数据状态
curl -X GET http://localhost:3000/api/clear-data

# 2. 执行完整重置（清空+初始化）
curl -X POST http://localhost:3000/api/init-data
```

### 场景2: 仅清空数据不初始化
当只需要清空数据，不需要重新初始化分类时：

```bash
curl -X POST http://localhost:3000/api/clear-data
```

### 场景3: 开发环境数据重置
在开发环境中快速重置测试数据：

```bash
# 使用提供的测试脚本
cd next-api
node test-clear-database.js
```

## 注意事项

⚠️ **重要警告**:
- 这些操作会**永久删除**所有数据，请谨慎使用
- 建议在生产环境使用前先备份重要数据
- 操作不可逆，请确认后再执行

💡 **建议**:
- 在开发环境中使用这些功能进行快速数据重置
- 生产环境建议添加额外的认证和确认机制
- 定期备份重要的用户数据和交易记录

## 测试验证

项目提供了测试脚本 `test-clear-database.js` 来验证功能的正确性：

```bash
cd next-api
node test-clear-database.js
```

测试脚本会依次执行：
1. 查看当前数据库状态
2. 清空所有数据
3. 重新初始化默认数据
4. 验证最终状态

## 环境配置

确保以下环境变量已正确配置：

```env
MONGODB_URI=mongodb+srv://...
DB_NAME=accounting_app
```

数据库配置基于项目使用的MongoDB Atlas，数据库名称为 `accounting_app`。