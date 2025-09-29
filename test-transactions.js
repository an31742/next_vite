// 测试交易功能的脚本
const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3002'; // 根据实际情况调整

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

async function testTransactions() {
  console.log('=== 测试交易功能 ===\n');

  try {
    // 1. 先创建一个测试用户并获取 token
    console.log('1. 创建测试用户...');
    const loginResult = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        code: 'test_transaction_user_' + Date.now()
      })
    });

    if (loginResult.data.code !== 200) {
      console.log('❌ 登录失败:', loginResult.data.message);
      return;
    }

    const token = loginResult.data.data.access_token;
    const userId = loginResult.data.data.user.id;
    console.log('✅ 登录成功，用户ID:', userId);

    // 2. 获取分类列表
    console.log('\n2. 获取分类列表...');
    const categoriesResult = await makeRequest('/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('分类响应:', JSON.stringify(categoriesResult.data, null, 2));

    if (categoriesResult.data.code !== 200) {
      console.log('❌ 获取分类失败:', categoriesResult.data.message);
      return;
    }

    const categoriesData = categoriesResult.data.data;
    // 分类数据可能是按类型分组的，也可能是直接的数组
    let allCategories = [];
    if (Array.isArray(categoriesData)) {
      allCategories = categoriesData;
    } else {
      // 按类型分组的格式
      allCategories = [...(categoriesData.income || []), ...(categoriesData.expense || [])];
    }

    console.log('✅ 获取到', allCategories.length, '个分类');

    // 选择一个支出分类
    const expenseCategory = allCategories.find(c => c.type === 'expense');
    const incomeCategory = allCategories.find(c => c.type === 'income');

    if (!expenseCategory || !incomeCategory) {
      console.log('❌ 未找到支出或收入分类');
      console.log('所有分类:', JSON.stringify(allCategories, null, 2));
      return;
    }

    // 3. 创建支出交易
    console.log('\n3. 创建支出交易...');
    const expenseResult = await makeRequest('/api/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'expense',
        amount: 50.00,
        categoryId: expenseCategory.id,
        note: '测试支出',
        date: new Date().toISOString().split('T')[0]
      })
    });

    console.log('支出交易响应:', JSON.stringify(expenseResult.data, null, 2));

    if (expenseResult.data.code === 200) {
      console.log('✅ 支出交易创建成功');
    } else {
      console.log('❌ 支出交易创建失败:', expenseResult.data.message);
    }

    // 4. 创建收入交易
    console.log('\n4. 创建收入交易...');
    const incomeResult = await makeRequest('/api/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'income',
        amount: 100.00,
        categoryId: incomeCategory.id,
        note: '测试收入',
        date: new Date().toISOString().split('T')[0]
      })
    });

    console.log('收入交易响应:', JSON.stringify(incomeResult.data, null, 2));

    if (incomeResult.data.code === 200) {
      console.log('✅ 收入交易创建成功');
    } else {
      console.log('❌ 收入交易创建失败:', incomeResult.data.message);
    }

    // 5. 获取交易列表
    console.log('\n5. 获取交易列表...');
    const transactionsResult = await makeRequest('/api/transactions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('交易列表响应:', JSON.stringify(transactionsResult.data, null, 2));

    if (transactionsResult.data.code === 200) {
      console.log('✅ 交易列表获取成功，共', transactionsResult.data.data.list.length, '条记录');
    } else {
      console.log('❌ 交易列表获取失败:', transactionsResult.data.message);
    }

  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testTransactions();
}

module.exports = { testTransactions };