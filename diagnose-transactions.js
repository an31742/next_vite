// 诊断交易记录问题的完整脚本
const { MongoClient } = require('mongodb');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3002';

async function diagnoseTransactions() {
  const uri = "mongodb+srv://an31742:212314@cluster0.2xk4dyf.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('=== 交易记录问题诊断 ===\n');

    const db = client.db('accounting_app');
    const users = db.collection('users');
    const transactions = db.collection('transactions');

    // 1. 统计用户和交易数据
    const totalUsers = await users.countDocuments();
    const totalTransactions = await transactions.countDocuments();

    console.log('📊 数据库统计:');
    console.log('   总用户数:', totalUsers);
    console.log('   总交易数:', totalTransactions);

    // 2. 查找最近的用户
    console.log('\n👥 最近注册的用户:');
    const recentUsers = await users.find().sort({ createdAt: -1 }).limit(5).toArray();
    recentUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nickname} (ID: ${user.id})`);
      console.log(`      OpenID: ${user.openid.substring(0, 20)}...`);
      console.log(`      注册时间: ${user.createdAt}`);
    });

    // 3. 查找最近的交易
    console.log('\n💰 最近的交易记录:');
    const recentTransactions = await transactions.find().sort({ createdAt: -1 }).limit(5).toArray();
    if (recentTransactions.length > 0) {
      recentTransactions.forEach((transaction, index) => {
        console.log(`   ${index + 1}. ${transaction.type === 'income' ? '收入' : '支出'} ¥${transaction.amount}`);
        console.log(`      用户ID: ${transaction.userId}`);
        console.log(`      分类: ${transaction.categoryId}`);
        console.log(`      日期: ${transaction.date}`);
        console.log(`      时间: ${transaction.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   暂无交易记录');
    }

    // 4. 检查特定用户的交易
    if (recentUsers.length > 0) {
      const firstUser = recentUsers[0];
      console.log(`\n🔍 检查用户 ${firstUser.nickname} 的交易记录:`);
      const userTransactions = await transactions.find({ userId: firstUser.id }).toArray();
      console.log(`   该用户有 ${userTransactions.length} 条交易记录`);

      if (userTransactions.length > 0) {
        userTransactions.slice(0, 3).forEach((transaction, index) => {
          console.log(`   ${index + 1}. ${transaction.type === 'income' ? '收入' : '支出'} ¥${transaction.amount}`);
          console.log(`      分类: ${transaction.categoryId}`);
          console.log(`      日期: ${transaction.date}`);
        });
      }
    }

    console.log('\n✅ 诊断完成');

  } catch (error) {
    console.error('❌ 诊断过程中出现错误:', error);
  } finally {
    await client.close();
  }
}

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

async function testApiTransactions() {
  console.log('\n=== API 接口测试 ===');

  try {
    // 1. 创建测试用户
    console.log('1. 创建测试用户...');
    const loginResult = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        code: 'test_diagnose_user_' + Date.now()
      })
    });

    if (loginResult.data.code !== 200) {
      console.log('❌ 登录失败:', loginResult.data.message);
      return;
    }

    const token = loginResult.data.data.access_token;
    const userId = loginResult.data.data.user.id;
    console.log('✅ 登录成功，用户ID:', userId);

    // 2. 获取交易列表
    console.log('\n2. 获取交易列表...');
    const transactionsResult = await makeRequest('/api/transactions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('API响应状态:', transactionsResult.response.statusCode);
    console.log('交易列表数据:', JSON.stringify(transactionsResult.data, null, 2));

    if (transactionsResult.data.code === 200) {
      console.log('✅ API接口正常工作');
    } else {
      console.log('❌ API接口异常:', transactionsResult.data.message);
    }

  } catch (error) {
    console.error('API测试过程中出现错误:', error.message);
  }
}

async function runFullDiagnosis() {
  await diagnoseTransactions();
  await testApiTransactions();
}

// 运行诊断
if (require.main === module) {
  runFullDiagnosis();
}

module.exports = { diagnoseTransactions, testApiTransactions, runFullDiagnosis };