#!/usr/bin/env node

// 测试用户初始化和重置功能
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

async function testUserInitialization() {
  console.log('🧪 测试用户初始化功能...\n');

  try {
    // 1. 模拟用户登录（需要实际的微信code）
    console.log('📱 模拟用户登录...');
    // 注意：实际测试需要真实的微信登录code

    // 2. 测试用户统计接口
    console.log('📊 获取用户统计...');
    const statsResponse = await fetch(`${API_BASE}/admin/users-stats`);
    const statsData = await statsResponse.json();

    if (statsData.code === 200) {
      console.log('✅ 用户统计获取成功');
      console.log(`总用户数: ${statsData.data.userStats.length}`);

      statsData.data.userStats.forEach((userStat, index) => {
        const { user, summary } = userStat;
        console.log(`${index + 1}. 用户${user.id.slice(-6)}: 余额 ¥${summary.balance.toFixed(2)} (收入: ¥${summary.income}, 支出: ¥${summary.expense}, 记录数: ${summary.count})`);
      });
    } else {
      console.log('❌ 获取用户统计失败:', statsData.message);
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('💥 测试失败:', error.message);
  }
}

// 测试用户重置功能
async function testUserReset() {
  const TEST_TOKEN = process.env.TEST_TOKEN || 'your_jwt_token_here';

  if (TEST_TOKEN === 'your_jwt_token_here') {
    console.log('⚠️ 请设置有效的JWT token进行用户重置测试');
    return;
  }

  console.log('🔄 测试用户重置功能...\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  };

  try {
    // 1. 获取当前用户状态
    console.log('📊 获取当前用户状态...');
    const statusResponse = await fetch(`${API_BASE}/user/reset-transactions`, { headers });
    const statusData = await statusResponse.json();

    if (statusData.code === 200) {
      console.log('✅ 当前状态:', JSON.stringify(statusData.data.summary, null, 2));
    }

    // 2. 重置用户交易记录
    console.log('\n🗑️ 重置用户交易记录...');
    const resetResponse = await fetch(`${API_BASE}/user/reset-transactions`, {
      method: 'POST',
      headers
    });
    const resetData = await resetResponse.json();

    if (resetData.code === 200) {
      console.log('✅ 重置成功:', resetData.message);
      console.log(`删除了 ${resetData.data.deletedCount} 条记录`);
    } else {
      console.log('❌ 重置失败:', resetData.message);
    }

    // 3. 验证重置后状态
    console.log('\n🔍 验证重置后状态...');
    const verifyResponse = await fetch(`${API_BASE}/user/reset-transactions`, { headers });
    const verifyData = await verifyResponse.json();

    if (verifyData.code === 200) {
      console.log('✅ 重置后状态:', JSON.stringify(verifyData.data.summary, null, 2));
    }

  } catch (error) {
    console.error('💥 重置测试失败:', error.message);
  }
}

console.log('🎯 用户初始化与重置功能测试\n');
console.log('1. 用户初始化统计');
console.log('2. 用户重置功能（需要JWT token）\n');

// 运行测试
testUserInitialization().then(() => {
  console.log('\n' + '='.repeat(50) + '\n');
  return testUserReset();
});