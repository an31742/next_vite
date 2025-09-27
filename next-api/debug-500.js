/**
 * 简单测试脚本 - 检查 500 错误
 */

const https = require('https');

function testAPI(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'next-vite-delta.vercel.app',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n=== ${path} ===`);
        console.log(`Status: ${res.statusCode}`);

        try {
          const jsonData = JSON.parse(data);
          console.log('Response:', JSON.stringify(jsonData, null, 2));
        } catch (error) {
          console.log('Raw response:', data);
        }

        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error(`Error for ${path}:`, error.message);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔍 检查 API 错误...');

  try {
    // 测试基本的分类接口
    await testAPI('/api/categories');

    // 测试登录接口
    await testAPI('/api/auth/login');

    // 测试统计接口
    await testAPI('/api/statistics/monthly');

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

runTests();