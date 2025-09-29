// 微信登录问题诊断脚本
console.log('=== 微信登录问题诊断 ===');

// 1. 检查环境变量
console.log('1. 环境变量检查:');
console.log('   NODE_ENV:', process.env.NODE_ENV || '未设置');
console.log('   WECHAT_APP_ID:', process.env.WECHAT_APP_ID ?
  (process.env.WECHAT_APP_ID.includes('your_') ? '测试值' : '已设置') :
  '未设置');
console.log('   WECHAT_APP_SECRET:', process.env.WECHAT_APP_SECRET ?
  (process.env.WECHAT_APP_SECRET.includes('your_') ? '测试值' : '已设置') :
  '未设置');

// 2. 诊断可能的问题
console.log('\n2. 问题诊断:');
if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
  console.log('   ❌ 严重问题: 缺少微信配置');
  console.log('      解决方案: 在环境变量中设置真实的 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
} else if (process.env.WECHAT_APP_ID.includes('your_') || process.env.WECHAT_APP_SECRET.includes('your_')) {
  console.log('   ❌ 严重问题: 微信配置为测试值');
  console.log('      解决方案: 在环境变量中设置真实的 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
} else {
  console.log('   ✅ 微信配置检查通过');

  if (process.env.NODE_ENV !== 'production') {
    console.log('   ⚠️  注意: 当前不是生产环境');
    console.log('      如果在生产环境部署，请确保部署平台也配置了正确的环境变量');
  }
}

// 3. 部署平台检查建议
console.log('\n3. 部署平台检查建议:');
console.log('   如果您使用 Vercel、Heroku 等平台部署:');
console.log('   - 登录到您的部署平台控制台');
console.log('   - 找到环境变量设置');
console.log('   - 确保设置了以下变量:');
console.log('     * WECHAT_APP_ID = 您的真实微信小程序 AppID');
console.log('     * WECHAT_APP_SECRET = 您的真实微信小程序 AppSecret');
console.log('     * JWT_SECRET = 强随机字符串');
console.log('     * MONGODB_URI = 您的 MongoDB 连接字符串');

console.log('\n=== 诊断完成 ===');