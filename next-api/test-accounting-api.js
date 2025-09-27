/**
 * 记账小程序 API 测试脚本
 *
 * 使用方法:
 * 1. 启动开发服务器: npm run dev
 * 2. 运行测试脚本: node test-accounting-api.js
 */

const BASE_URL = 'http://localhost:3000';

// 模拟测试数据
const testData = {
  login: {
    code: 'test_wechat_code_123'
  },
  transaction: {
    type: 'expense',
    amount: 25.80,
    categoryId: 'food',
    note: '午餐',
    date: '2024-09-27'
  },
  category: {
    type: 'expense',
    name: '宠物用品',
    icon: '🐕',
    color: '#9C88FF'
  }
};

let accessToken = '';

// 辅助函数：发送HTTP请求
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    console.log(`\n${options.method || 'GET'} ${url}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    return { response, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    return { error };
  }
}

// 测试函数集合
const tests = {
  // 1. 测试用户登录
  async testLogin() {
    console.log('\n=== 测试用户登录 ===');
    const { data } = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(testData.login)
    });

    if (data && data.code === 200 && data.data.access_token) {
      accessToken = data.data.access_token;
      console.log('✅ 登录成功，已获取 access_token');
    } else {
      console.log('❌ 登录失败');
      return false;
    }
    return true;
  },

  // 2. 测试获取分类列表
  async testGetCategories() {
    console.log('\n=== 测试获取分类列表 ===');
    await makeRequest('/api/categories');
    await makeRequest('/api/categories?type=income');
    await makeRequest('/api/categories?type=expense');
  },

  // 3. 测试创建自定义分类
  async testCreateCategory() {
    console.log('\n=== 测试创建自定义分类 ===');
    await makeRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify(testData.category)
    });
  },

  // 4. 测试创建交易记录
  async testCreateTransaction() {
    console.log('\n=== 测试创建交易记录 ===');
    const { data } = await makeRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(testData.transaction)
    });

    if (data && data.code === 200 && data.data.id) {
      testData.transactionId = data.data.id;
      console.log('✅ 交易记录创建成功，ID:', testData.transactionId);
    }
  },

  // 5. 测试获取交易记录列表
  async testGetTransactions() {
    console.log('\n=== 测试获取交易记录列表 ===');
    await makeRequest('/api/transactions');
    await makeRequest('/api/transactions?page=1&pageSize=10');
    await makeRequest('/api/transactions?type=expense');
    await makeRequest('/api/transactions?categoryId=food');
    await makeRequest('/api/transactions?startDate=2024-09-01&endDate=2024-09-30');
  },

  // 6. 测试获取交易记录详情
  async testGetTransactionDetail() {
    console.log('\n=== 测试获取交易记录详情 ===');
    if (testData.transactionId) {
      await makeRequest(`/api/transactions/${testData.transactionId}`);
    } else {
      console.log('⚠️  跳过测试：没有可用的交易记录ID');
    }
  },

  // 7. 测试更新交易记录
  async testUpdateTransaction() {
    console.log('\n=== 测试更新交易记录 ===');
    if (testData.transactionId) {
      await makeRequest(`/api/transactions/${testData.transactionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: 30.00,
          note: '更新后的午餐费用'
        })
      });
    } else {
      console.log('⚠️  跳过测试：没有可用的交易记录ID');
    }
  },

  // 8. 测试统计接口
  async testStatistics() {
    console.log('\n=== 测试统计接口 ===');
    await makeRequest('/api/statistics/monthly');
    await makeRequest('/api/statistics/monthly?year=2024&month=9');
    await makeRequest('/api/statistics/yearly');
    await makeRequest('/api/statistics/yearly?year=2024');
    await makeRequest('/api/statistics/range?startDate=2024-09-01&endDate=2024-09-30');
  },

  // 9. 测试数据同步接口
  async testSync() {
    console.log('\n=== 测试数据同步接口 ===');

    // 测试批量上传
    const syncData = {
      transactions: [
        {
          localId: 'local_001',
          type: 'income',
          amount: 5000.00,
          categoryId: 'salary',
          note: '九月工资',
          date: '2024-09-01',
          createTime: new Date().toISOString()
        }
      ]
    };

    await makeRequest('/api/sync/transactions', {
      method: 'POST',
      body: JSON.stringify(syncData)
    });

    // 测试增量同步
    const lastSyncTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await makeRequest(`/api/sync/incremental?lastSyncTime=${lastSyncTime}`);
  },

  // 10. 测试删除交易记录
  async testDeleteTransaction() {
    console.log('\n=== 测试删除交易记录 ===');
    if (testData.transactionId) {
      await makeRequest(`/api/transactions/${testData.transactionId}`, {
        method: 'DELETE'
      });
    } else {
      console.log('⚠️  跳过测试：没有可用的交易记录ID');
    }
  }
};

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始测试记账小程序 API...');
  console.log(`📡 API 基础地址: ${BASE_URL}`);

  try {
    // 按顺序运行测试
    const loginSuccess = await tests.testLogin();
    if (!loginSuccess) {
      console.log('\n❌ 登录测试失败，无法继续后续测试');
      console.log('💡 请确保：');
      console.log('   1. 服务器已启动 (npm run dev)');
      console.log('   2. MongoDB 已连接');
      console.log('   3. 环境变量已正确配置');
      return;
    }

    await tests.testGetCategories();
    await tests.testCreateCategory();
    await tests.testCreateTransaction();
    await tests.testGetTransactions();
    await tests.testGetTransactionDetail();
    await tests.testUpdateTransaction();
    await tests.testStatistics();
    await tests.testSync();
    await tests.testDeleteTransaction();

    console.log('\n✅ 所有测试完成！');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
}

// 检查是否为直接运行
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, tests };