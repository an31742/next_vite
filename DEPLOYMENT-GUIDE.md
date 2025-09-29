# 生产环境部署指南

## 环境变量配置

在生产环境中，您需要配置以下环境变量：

### 1. 数据库配置
- `MONGODB_URI`: MongoDB 连接字符串
- `DB_NAME`: 数据库名称（默认为 accounting_app）

### 2. 安全配置
- `JWT_SECRET`: JWT 签名密钥，应使用强随机字符串

### 3. 微信小程序配置
- `WECHAT_APP_ID`: 微信小程序 AppID
- `WECHAT_APP_SECRET`: 微信小程序 AppSecret

## 获取微信小程序配置

1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入您的小程序管理后台
3. 在「开发」->「开发管理」->「开发设置」中找到：
   - AppID（小程序ID）
   - AppSecret（小程序密钥）

## 部署到 Vercel

1. 将代码推送到 GitHub/GitLab
2. 在 Vercel 中导入项目
3. 在项目设置中配置环境变量：
   ```
   MONGODB_URI=your_production_mongodb_uri
   DB_NAME=accounting_app
   JWT_SECRET=your_production_jwt_secret_key
   WECHAT_APP_ID=your_production_wechat_app_id
   WECHAT_APP_SECRET=your_production_wechat_app_secret
   ```
4. 触发部署

## 验证部署

部署完成后，您可以通过以下方式验证：

1. 访问您的应用 URL
2. 使用微信开发者工具测试登录功能
3. 确认可以获取到真实的微信用户信息

## 生产环境与开发环境的区别

| 功能 | 开发环境 | 生产环境 |
|------|----------|----------|
| 微信登录 | 支持测试 code（以 test_ 开头） | 仅支持真实的微信 code |
| 错误信息 | 详细错误信息 | 简化错误信息 |
| 日志记录 | 详细日志 | 仅记录关键信息 |
| 性能优化 | 无 | 启用各种优化 |

## 常见问题

### 1. 微信登录失败
- 检查 WECHAT_APP_ID 和 WECHAT_APP_SECRET 是否正确配置
- 确认微信小程序的服务器域名已正确配置

### 2. 数据库连接失败
- 检查 MONGODB_URI 是否正确
- 确认数据库服务器可以被访问

### 3. JWT 验证失败
- 检查 JWT_SECRET 是否正确配置
- 确认前后端使用相同的密钥