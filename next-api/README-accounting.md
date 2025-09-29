# 记账小程序后端 API

## 简介

这是一个基于 Next.js 的记账小程序后端 API，支持微信小程序登录、交易记录管理、数据统计等功能。

## 环境变量配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| MONGODB_URI | MongoDB 连接字符串 | mongodb://localhost:27017 |
| DB_NAME | 数据库名称 | accounting_app |
| JWT_SECRET | JWT 签名密钥 | your_jwt_secret_key |
| WECHAT_APP_ID | 微信小程序 AppID | wx1234567890abcdef |
| WECHAT_APP_SECRET | 微信小程序 AppSecret | your_wechat_app_secret |

## API 接口列表

### 用户认证模块

- `POST /api/auth/login` - 微信登录（通过code获取openid）
- `POST /api/auth/user-login` - 微信用户信息登录（获取用户昵称、头像等）
- `POST /api/auth/refresh` - 刷新 Token

### 交易记录模块

- `GET /api/transactions` - 获取交易记录列表
- `POST /api/transactions` - 创建交易记录
- `PUT /api/transactions/[id]` - 更新交易记录
- `DELETE /api/transactions/[id]` - 删除交易记录

### 分类管理模块

- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/[id]` - 更新分类
- `DELETE /api/categories/[id]` - 删除分类

### 数据统计模块

- `GET /api/statistics/monthly` - 月度统计数据
- `GET /api/statistics/yearly` - 年度统计数据
- `GET /api/statistics/range` - 时间范围统计数据

## 微信登录说明

### 1. 基础微信登录（仅获取 openid）

```
// 小程序端
wx.login({
  success: (res) => {
    if (res.code) {
      wx.request({
        url: 'https://your-domain.com/api/auth/login',
        method: 'POST',
        data: {
          code: res.code
        }
      });
    }
  }
});
```

### 2. 用户信息登录（获取昵称、头像等）

```
// 小程序端
wx.login({
  success: (loginRes) => {
    if (loginRes.code) {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (profileRes) => {
          wx.request({
            url: 'https://your-domain.com/api/auth/user-login',
            method: 'POST',
            data: {
              code: loginRes.code,
              userInfo: profileRes.userInfo
            }
          });
        }
      });
    }
  }
});
```

## 开发指南

1. 安装依赖：`npm install`
2. 配置环境变量
3. 启动开发服务器：`npm run dev`
4. 访问 http://localhost:3000 查看 API

## 部署指南

1. 确保配置了正确的环境变量
2. 部署到支持 Next.js 的平台（如 Vercel）
3. 在微信公众平台配置服务器域名

## 许可证

MIT License