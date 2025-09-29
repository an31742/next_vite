// 测试用户信息登录功能
const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000'; // 根据实际情况调整

// 模拟微信用户信息
const mockUserInfo = {
  nickName: "测试用户",
  avatarUrl: "https://example.com/avatar.jpg",
  gender: 1,
  country: "中国",
  province: "广东",
  city: "深圳"
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

async function testUserLogin() {
  console.log('=== 测试微信用户信息登录 ===\n');

  try {
    // 使用测试 code 进行登录
    const loginResult = await makeRequest('/api/auth/user-login', {
      method: 'POST',
      body: JSON.stringify({
        code: 'test_user_info_' + Date.now(),
        userInfo: mockUserInfo
      })
    });

    console.log('登录响应:', JSON.stringify(loginResult.data, null, 2));

    if (loginResult.data.code === 200) {
      console.log('\n✅ 微信用户信息登录成功');
      console.log('用户ID:', loginResult.data.data.user.id);
      console.log('用户名:', loginResult.data.data.user.nickname);
      console.log('是否新用户:', loginResult.data.data.isNewUser);
      console.log('初始余额:', loginResult.data.data.summary.balance);
    } else {
      console.log('\n❌ 登录失败:', loginResult.data.message);
    }

  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  testUserLogin();
}

module.exports = { testUserLogin };