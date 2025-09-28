#!/usr/bin/env node

// 测试月度重置功能的API接口
const https = require('https');
const http = require('http');
const { URL } = require('url');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

// 模拟JWT token（实际使用时需要通过登录获取）
const TEST_TOKEN = 'your_jwt_token_here';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

// 简单的HTTP请求封装
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: { ...headers, ...options.headers }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: { error: 'Invalid JSON response', raw: data } });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testMonthlyReset() {
  console.log('🧪 开始测试月度重置功能...\n');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  try {
    // 1. 查看当前月份1号的交易记录状态
    console.log(`📊 查看 ${currentYear}年${currentMonth}月1日 的交易记录状态...`);
    const viewResponse = await makeRequest(`${API_BASE}/monthly-reset?year=${currentYear}&month=${currentMonth}`);
    const viewData = viewResponse.data;

    if (viewData.code === 200) {
      console.log('✅ 查看成功:', JSON.stringify(viewData.data.summary, null, 2));
      console.log(`当前有 ${viewData.data.transactions.length} 条记录`);

      if (viewData.data.summary.totalIncome > 0 || viewData.data.summary.totalExpense > 0) {
        console.log(`💰 收入: ¥${viewData.data.summary.totalIncome}`);
        console.log(`💸 支出: ¥${viewData.data.summary.totalExpense}`);
        console.log(`💵 余额: ¥${viewData.data.summary.balance}`);
      } else {
        console.log('📝 该日期收入和支出已经都是0');
      }
    } else {
      console.log('❌ 查看失败:', viewData.message);
    }

    // 2. 测试将金额重置为0（保留交易记录）
    console.log(`\n🔄 测试重置 ${currentYear}年${currentMonth}月1日 的交易金额为0（保留记录）...`);
    const resetAmountResponse = await makeRequest(`${API_BASE}/monthly-reset`, {
      method: 'POST',
      body: JSON.stringify({
        year: currentYear,
        month: currentMonth,
        resetType: 'amount_only'
      })
    });
    const resetAmountData = resetAmountResponse.data;

    if (resetAmountData.code === 200) {
      console.log('✅ 金额重置成功:', resetAmountData.message);
      console.log('📊 重置统计:', JSON.stringify(resetAmountData.data.resetSummary, null, 2));
    } else {
      console.log('❌ 金额重置失败:', resetAmountData.message);
    }

    // 3. 验证重置后的状态
    console.log(`\n🔍 验证重置后的状态...`);
    const verifyResponse = await makeRequest(`${API_BASE}/monthly-reset?year=${currentYear}&month=${currentMonth}`);
    const verifyData = verifyResponse.data;

    if (verifyData.code === 200) {
      console.log('✅ 验证成功:', JSON.stringify(verifyData.data.summary, null, 2));

      if (verifyData.data.summary.totalIncome === 0 && verifyData.data.summary.totalExpense === 0) {
        console.log('🎉 重置成功！收入和支出都已设置为0');
      } else {
        console.log('⚠️ 重置可能未完全生效');
      }
    } else {
      console.log('❌ 验证失败:', verifyData.message);
    }

    // 4. 测试批量重置多个月份
    console.log(`\n📅 测试批量重置多个月份的1号记录...`);
    const monthlyResets = [
      { year: currentYear, month: 1 },
      { year: currentYear, month: 2 },
      { year: currentYear, month: 3 }
    ];

    const batchResetResponse = await makeRequest(`${API_BASE}/monthly-reset`, {
      method: 'PUT',
      body: JSON.stringify({
        monthlyResets,
        resetType: 'amount_only'
      })
    });
    const batchResetData = batchResetResponse.data;

    if (batchResetData.code === 200) {
      console.log('✅ 批量重置成功:', batchResetData.message);
      console.log('📊 批量重置统计:', JSON.stringify(batchResetData.data.summary, null, 2));

      // 显示具体结果
      batchResetData.data.results.forEach(result => {
        console.log(`  - ${result.year}年${result.month}月: ${result.status} ${result.reason || ''}`);
      });
    } else {
      console.log('❌ 批量重置失败:', batchResetData.message);
    }

    // 5. 测试删除模式（软删除交易记录）
    console.log(`\n🗑️ 测试删除模式重置（软删除交易记录）...`);
    const deleteResetResponse = await makeRequest(`${API_BASE}/monthly-reset`, {
      method: 'POST',
      body: JSON.stringify({
        year: currentYear,
        month: currentMonth,
        resetType: 'delete_all'
      })
    });
    const deleteResetData = deleteResetResponse.data;

    if (deleteResetData.code === 200) {
      console.log('✅ 删除重置成功:', deleteResetData.message);
      console.log('📊 删除统计:', JSON.stringify(deleteResetData.data.resetSummary, null, 2));
    } else {
      console.log('❌ 删除重置失败:', deleteResetData.message);
    }

    console.log('\n🎯 月度重置功能测试完成！');

  } catch (error) {
    console.error('💥 测试过程中出现错误:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保API服务器正在运行');
      console.log('   可以运行: npm run dev 或 yarn dev');
    }
  }
}

// 测试参数验证
async function testParameterValidation() {
  console.log('\n🧪 测试参数验证...\n');

  const testCases = [
    {
      name: '无效年份（太小）',
      params: { year: 2019, month: 1, resetType: 'amount_only' }
    },
    {
      name: '无效年份（太大）',
      params: { year: 2031, month: 1, resetType: 'amount_only' }
    },
    {
      name: '无效月份（太小）',
      params: { year: 2024, month: 0, resetType: 'amount_only' }
    },
    {
      name: '无效月份（太大）',
      params: { year: 2024, month: 13, resetType: 'amount_only' }
    },
    {
      name: '无效重置类型',
      params: { year: 2024, month: 1, resetType: 'invalid_type' }
    },
    {
      name: '缺少年份参数',
      params: { month: 1, resetType: 'amount_only' }
    },
    {
      name: '缺少月份参数',
      params: { year: 2024, resetType: 'amount_only' }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🔍 测试: ${testCase.name}`);
      const response = await makeRequest(`${API_BASE}/monthly-reset`, {
        method: 'POST',
        body: JSON.stringify(testCase.params)
      });
      const data = response.data;

      if (data.code !== 200) {
        console.log(`✅ 预期错误: ${data.message}`);
      } else {
        console.log(`⚠️ 意外成功: 应该返回错误但成功了`);
      }
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 月度重置功能测试开始\n');
  console.log('===================================');

  // 检查环境变量
  if (TEST_TOKEN === 'your_jwt_token_here') {
    console.log('⚠️ 警告: 使用的是默认测试Token，请设置有效的JWT Token');
    console.log('   可以通过登录接口获取真实的Token\n');
  }

  await testMonthlyReset();
  await testParameterValidation();

  console.log('\n===================================');
  console.log('✨ 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testMonthlyReset,
  testParameterValidation
};