#!/usr/bin/env node

// 测试记账本数据库清空功能
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

async function testClearDatabase() {
  console.log('🧪 开始测试记账本数据库清空功能...\n');

  try {
    // 1. 获取清空前的数据统计
    console.log('📊 获取数据库当前状态...');
    const statsResponse = await fetch(`${API_BASE}/clear-data`);
    const statsData = await statsResponse.json();

    if (statsData.code === 200) {
      console.log('✅ 数据库状态:', JSON.stringify(statsData.data, null, 2));
    } else {
      console.log('❌ 获取数据库状态失败:', statsData.message);
    }

    // 2. 执行数据库清空
    console.log('\n🗑️  执行数据库清空...');
    const clearResponse = await fetch(`${API_BASE}/clear-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const clearData = await clearResponse.json();

    if (clearData.code === 200) {
      console.log('✅ 数据库清空成功:', JSON.stringify(clearData.data, null, 2));
    } else {
      console.log('❌ 数据库清空失败:', clearData.message);
      return;
    }

    // 3. 重新初始化数据
    console.log('\n🔄 重新初始化数据...');
    const initResponse = await fetch(`${API_BASE}/init-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const initData = await initResponse.json();

    if (initData.code === 200) {
      console.log('✅ 数据初始化成功:', JSON.stringify(initData.data, null, 2));
    } else {
      console.log('❌ 数据初始化失败:', initData.message);
    }

    // 4. 验证最终状态
    console.log('\n🔍 验证最终数据库状态...');
    const finalStatsResponse = await fetch(`${API_BASE}/clear-data`);
    const finalStatsData = await finalStatsResponse.json();

    if (finalStatsData.code === 200) {
      console.log('✅ 最终数据库状态:', JSON.stringify(finalStatsData.data, null, 2));
    } else {
      console.log('❌ 获取最终状态失败:', finalStatsData.message);
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testClearDatabase();