// 测试微信配置的脚本
async function testWechatConfig() {
  console.log('=== 微信配置测试 ===');

  // 检查环境变量
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  const nodeEnv = process.env.NODE_ENV;

  console.log('NODE_ENV:', nodeEnv);
  console.log('WECHAT_APP_ID:', appId ? (appId.includes('your_') ? '测试值: ' + appId : '已设置') : '未设置');
  console.log('WECHAT_APP_SECRET:', appSecret ? (appSecret.includes('your_') ? '测试值: (隐藏)' : '已设置') : '未设置');

  if (!appId || !appSecret) {
    console.log('❌ 错误: 缺少微信配置');
    return;
  }

  if (appId.includes('your_') || appSecret.includes('your_')) {
    console.log('❌ 错误: 微信配置仍为测试值');
    console.log('   请在环境变量中设置真实的 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
    return;
  }

  console.log('✅ 微信配置检查通过');
  console.log('   环境:', nodeEnv === 'production' ? '生产环境' : '开发环境');
  console.log('   提示: 确保在部署平台(如Vercel)中也配置了相同的环境变量');
}

testWechatConfig();