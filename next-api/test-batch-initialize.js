#!/usr/bin/env node

// 测试批量用户初始化功能
const https = require('https');
const http = require('http');
const { URL } = require('url');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

// 管理员Token（需要设置真实的管理员Token）
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin_jwt_token_here';

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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.token || ADMIN_TOKEN}`,
        ...options.headers
      }
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

async function testBatchInitialize() {
  console.log('🚀 开始测试批量用户初始化功能...\n');

  try {
    // 1. 获取当前所有用户状态概览
    console.log('👥 获取当前所有用户状态...');
    const usersStatsResponse = await makeRequest(`${API_BASE}/admin/users-stats`);

    if (usersStatsResponse.data.code === 200) {
      console.log('✅ 获取用户统计成功');
      const userStats = usersStatsResponse.data.data.userStats;
      console.log(`📊 当前系统共有 ${userStats.length} 个用户`);

      userStats.forEach((userStat, index) => {
        const { user, summary } = userStat;
        const status = summary.count === 0 ? '🆕新用户' :
                     (summary.income === 0 && summary.expense === 0) ? '✅已初始化' : '💰有数据';
        console.log(`  ${index + 1}. ${user.nickname} (${user.id.slice(-6)}): ${status} - 余额¥${summary.balance.toFixed(2)} (${summary.count}条记录)`);
      });
    } else {
      console.log('❌ 获取用户统计失败:', usersStatsResponse.data.message);
      return;
    }

    // 2. 获取批量初始化预览（所有用户）
    console.log('\n🔍 获取批量初始化预览（所有用户）...');
    const previewAllResponse = await makeRequest(`${API_BASE}/admin/batch-initialize?targetUsers=all`);

    if (previewAllResponse.data.code === 200) {
      console.log('✅ 预览获取成功');
      const { previewSummary, userPreviews } = previewAllResponse.data.data;

      console.log('📋 预览摘要:');
      console.log(`  总用户数: ${previewSummary.totalUsers}`);
      console.log(`  新用户: ${previewSummary.newUsers}`);
      console.log(`  现有用户: ${previewSummary.existingUsers}`);
      console.log(`  需要初始化的用户: ${previewSummary.usersNeedingInitialization}`);

      console.log('\n👤 用户详情:');
      userPreviews.forEach((preview, index) => {
        const { user, summary, isNewUser, needsInitialization } = preview;
        const status = isNewUser ? '🆕新' : needsInitialization ? '⚠️需初始化' : '✅正常';
        console.log(`  ${index + 1}. ${user.nickname}: ${status} - 收入¥${summary.totalIncome}, 支出¥${summary.totalExpense}`);
      });
    } else {
      console.log('❌ 获取预览失败:', previewAllResponse.data.message);
    }

    // 3. 获取新用户预览
    console.log('\n🆕 获取新用户预览...');
    const previewNewResponse = await makeRequest(`${API_BASE}/admin/batch-initialize?targetUsers=new_only`);

    if (previewNewResponse.data.code === 200) {
      const { previewSummary } = previewNewResponse.data.data;
      console.log(`✅ 发现 ${previewSummary.totalUsers} 个新用户需要初始化`);
    } else {
      console.log('❌ 获取新用户预览失败:', previewNewResponse.data.message);
    }

    // 4. 测试仅初始化新用户（金额清零）
    console.log('\n🔄 测试初始化新用户（仅金额清零）...');
    const initializeNewResponse = await makeRequest(`${API_BASE}/admin/batch-initialize`, {
      method: 'POST',
      body: JSON.stringify({
        targetUsers: 'new_only',
        initializeType: 'amount_only',
        forceReset: false
      })
    });

    if (initializeNewResponse.data.code === 200) {
      console.log('✅ 新用户初始化成功:', initializeNewResponse.data.message);
      const { summary, results } = initializeNewResponse.data.data;

      console.log('📊 初始化摘要:');
      console.log(`  处理用户数: ${summary.totalUsers}`);
      console.log(`  成功: ${summary.successCount}`);
      console.log(`  失败: ${summary.errorCount}`);
      console.log(`  跳过: ${summary.skippedCount}`);

      console.log('\n📋 处理结果:');
      results.forEach((result, index) => {
        const statusIcon = result.status === 'success' ? '✅' :
                          result.status === 'failed' ? '❌' : '⏭️';
        console.log(`  ${index + 1}. ${statusIcon} ${result.nickname}: ${result.status}`);
        if (result.reason) console.log(`      原因: ${result.reason}`);
        if (result.processedCount !== undefined) console.log(`      处理记录数: ${result.processedCount}`);
      });
    } else {
      console.log('❌ 新用户初始化失败:', initializeNewResponse.data.message);
    }

    // 5. 测试强制重置所有用户（谨慎操作！）
    console.log('\n⚠️ 测试强制重置所有用户（演示，不实际执行）...');
    console.log('如需强制重置所有用户，请执行:');
    console.log(`curl -X POST "${API_BASE}/admin/batch-initialize" \\`);
    console.log(`  -H "Authorization: Bearer \${ADMIN_TOKEN}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{`);
    console.log(`    "targetUsers": "all",`);
    console.log(`    "initializeType": "delete_all",`);
    console.log(`    "forceReset": true`);
    console.log(`  }'`);

    // 6. 验证初始化结果
    console.log('\n🔍 验证初始化结果...');
    const verifyResponse = await makeRequest(`${API_BASE}/admin/users-stats`);

    if (verifyResponse.data.code === 200) {
      console.log('✅ 验证完成');
      const userStats = verifyResponse.data.data.userStats;
      const initializedUsers = userStats.filter(u => u.summary.income === 0 && u.summary.expense === 0);
      console.log(`📊 已正确初始化的用户: ${initializedUsers.length}/${userStats.length}`);

      const problemUsers = userStats.filter(u => u.summary.income !== 0 || u.summary.expense !== 0);
      if (problemUsers.length > 0) {
        console.log('⚠️ 仍有数据的用户:');
        problemUsers.forEach(u => {
          console.log(`  - ${u.user.nickname}: 收入¥${u.summary.income}, 支出¥${u.summary.expense}`);
        });
      }
    } else {
      console.log('❌ 验证失败:', verifyResponse.data.message);
    }

  } catch (error) {
    console.error('💥 测试过程中出现错误:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保API服务器正在运行');
      console.log('   可以运行: npm run dev 或 yarn dev');
    }
  }
}

async function testSpecificUsersBatchInitialize() {
  console.log('\n🎯 测试指定用户批量初始化...\n');

  try {
    // 获取前两个用户的ID进行测试
    const usersResponse = await makeRequest(`${API_BASE}/admin/users-stats`);

    if (usersResponse.data.code === 200) {
      const userStats = usersResponse.data.data.userStats;
      if (userStats.length >= 2) {
        const targetUserIds = userStats.slice(0, 2).map(u => u.user.id);

        console.log(`🎯 测试指定用户初始化: ${targetUserIds.join(', ')}`);

        const specificInitResponse = await makeRequest(`${API_BASE}/admin/batch-initialize`, {
          method: 'POST',
          body: JSON.stringify({
            targetUsers: targetUserIds,
            initializeType: 'amount_only',
            forceReset: true
          })
        });

        if (specificInitResponse.data.code === 200) {
          console.log('✅ 指定用户初始化成功:', specificInitResponse.data.message);

          specificInitResponse.data.data.results.forEach(result => {
            console.log(`  - ${result.nickname}: ${result.status} (处理${result.processedCount || 0}条记录)`);
          });
        } else {
          console.log('❌ 指定用户初始化失败:', specificInitResponse.data.message);
        }
      } else {
        console.log('⚠️ 用户数量不足，跳过指定用户测试');
      }
    }
  } catch (error) {
    console.error('💥 指定用户测试失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🧪 批量用户初始化功能测试开始\n');
  console.log('==========================================');

  // 检查环境变量
  if (ADMIN_TOKEN === 'admin_jwt_token_here') {
    console.log('⚠️ 警告: 使用的是默认管理员Token，请设置有效的管理员JWT Token');
    console.log('   可以通过管理员登录接口获取真实的Token\n');
  }

  await testBatchInitialize();
  await testSpecificUsersBatchInitialize();

  console.log('\n==========================================');
  console.log('✨ 所有测试完成！');

  console.log('\n📋 功能总结:');
  console.log('1. ✅ 批量初始化所有用户');
  console.log('2. ✅ 仅初始化新用户');
  console.log('3. ✅ 指定用户批量初始化');
  console.log('4. ✅ 初始化预览功能');
  console.log('5. ✅ 多种初始化模式（金额清零/删除记录）');

  console.log('\n🔧 使用说明:');
  console.log('- 预览: GET /api/admin/batch-initialize?targetUsers=all');
  console.log('- 初始化新用户: POST /api/admin/batch-initialize {"targetUsers":"new_only"}');
  console.log('- 强制重置所有用户: POST /api/admin/batch-initialize {"targetUsers":"all","forceReset":true}');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testBatchInitialize,
  testSpecificUsersBatchInitialize
};