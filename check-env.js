console.log('=== 环境变量检查 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('WECHAT_APP_ID:', process.env.WECHAT_APP_ID ? '已设置' : '未设置');
console.log('WECHAT_APP_SECRET:', process.env.WECHAT_APP_SECRET ? '已设置' : '未设置');

// 检查是否包含测试值
if (process.env.WECHAT_APP_ID && process.env.WECHAT_APP_ID.includes('your_')) {
  console.log('⚠️  WARNING: WECHAT_APP_ID 似乎还是测试值');
}

if (process.env.WECHAT_APP_SECRET && process.env.WECHAT_APP_SECRET.includes('your_')) {
  console.log('⚠️  WARNING: WECHAT_APP_SECRET 似乎还是测试值');
}

console.log('==================');