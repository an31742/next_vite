const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000';

// 模拟测试数据
const testData = {
  login: {
    code: 'test_wechat_code_' + Date.now() // 使用时间戳确保每次都是新的code
  }
};

// HTTP 请求函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${url}`;
    const urlObj = new URL(fullUrl);

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ response: res, data: jsonData });
        } catch (e) {
          resolve({ response: res, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testWechatLogin() {
  console.log('🧪 测试微信登录功能...\n');

  try {
    // 1. 测试微信登录
    console.log('📱 模拟微信登录...');
    const loginResult = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(testData.login)
    });

    console.log('登录响应:', JSON.stringify(loginResult.data, null, 2));

    if (loginResult.data.code === 200) {
      console.log('✅ 微信登录成功');

      if (loginResult.data.data.isNewUser) {
        console.log('🆕 确认为新用户');
        console.log('💰 初始余额:', loginResult.data.data.summary.balance);
      } else {
        console.log('🔁 现有用户登录');
      }

      // 获取用户信息
      console.log('👤 用户信息:', JSON.stringify(loginResult.data.data.user, null, 2));
    } else {
      console.log('❌ 微信登录失败:', loginResult.data.message);

      // 检查是否是微信配置问题
      if (loginResult.data.error === 'WECHAT_LOGIN_FAILED') {
        console.log('💡 可能是微信配置问题，请检查 WECHAT_APP_ID 和 WECHAT_APP_SECRET 环境变量');
      }
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('💥 测试过程中出现错误:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保API服务器正在运行');
      console.log('   可以运行: npm run dev 或 yarn dev');
    }
  }
}

// 运行测试
testWechatLogin();