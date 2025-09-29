#!/usr/bin/env node

/**
 * 管理员接口测试脚本
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 配置
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your_admin_jwt_token_here';

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
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// 测试管理员接口
async function testAdminAPI() {
  console.log('🚀 开始测试管理员接口...\n');

  try {
    // 1. 测试管理员接口根路径
    console.log('1. 测试管理员接口根路径...');
    const rootResponse = await makeRequest(`${API_BASE}/admin`);
    console.log(`   状态码: ${rootResponse.status}`);
    console.log(`   响应: ${rootResponse.data.message}\n`);

    // 2. 测试用户统计接口
    console.log('2. 测试用户统计接口...');
    const usersStatsResponse = await makeRequest(`${API_BASE}/admin/users-stats`);
    console.log(`   状态码: ${usersStatsResponse.status}`);
    if (usersStatsResponse.data.code === 200) {
      console.log(`   ✅ 成功获取 ${usersStatsResponse.data.data.userStats.length} 个用户统计`);
    } else {
      console.log(`   ❌ 错误: ${usersStatsResponse.data.message}`);
    }

    // 3. 测试系统管理统计接口
    console.log('\n3. 测试系统管理统计接口...');
    const systemStatsResponse = await makeRequest(`${API_BASE}/admin/system-manage`);
    console.log(`   状态码: ${systemStatsResponse.status}`);
    if (systemStatsResponse.data.code === 200) {
      console.log(`   ✅ 系统统计:`);
      console.log(`      用户数: ${systemStatsResponse.data.data.collections.users}`);
      console.log(`      交易记录数: ${systemStatsResponse.data.data.collections.transactions}`);
      console.log(`      总记录数: ${systemStatsResponse.data.data.totalRecords}`);
    } else {
      console.log(`   ❌ 错误: ${systemStatsResponse.data.message}`);
    }

    // 4. 测试批量初始化预览接口
    console.log('\n4. 测试批量初始化预览接口...');
    const batchInitPreviewResponse = await makeRequest(`${API_BASE}/admin/batch-initialize`);
    console.log(`   状态码: ${batchInitPreviewResponse.status}`);
    if (batchInitPreviewResponse.data.code === 200) {
      const summary = batchInitPreviewResponse.data.data.previewSummary;
      console.log(`   ✅ 批量初始化预览:`);
      console.log(`      总用户数: ${summary.totalUsers}`);
      console.log(`      新用户: ${summary.newUsers}`);
      console.log(`      需要初始化: ${summary.usersNeedingInitialization}`);
    } else {
      console.log(`   ❌ 错误: ${batchInitPreviewResponse.data.message}`);
    }

    // 5. 测试系统监控接口
    console.log('\n5. 测试系统监控接口...');
    const monitorResponse = await makeRequest(`${API_BASE}/admin/monitor?action=overview`);
    console.log(`   状态码: ${monitorResponse.status}`);
    if (monitorResponse.data.code === 200) {
      console.log(`   ✅ 系统监控信息获取成功`);
      console.log(`      数据库状态: ${monitorResponse.data.data.database.status}`);
      console.log(`      用户数: ${monitorResponse.data.data.database.collections.users}`);
    } else {
      console.log(`   ❌ 错误: ${monitorResponse.data.message}`);
    }

    // 6. 测试数据导出接口
    console.log('\n6. 测试数据导出接口...');
    const exportResponse = await makeRequest(`${API_BASE}/admin/data-export?type=statistics&format=json`);
    console.log(`   状态码: ${exportResponse.status}`);
    if (exportResponse.data.code === 200) {
      console.log(`   ✅ 数据导出成功`);
      console.log(`      导出类型: ${exportResponse.data.data.exportType}`);
      console.log(`      数据条数: ${Array.isArray(exportResponse.data.data.data.statistics) ? exportResponse.data.data.data.statistics.length : 0}`);
    } else {
      console.log(`   ❌ 错误: ${exportResponse.data.message}`);
    }

    console.log('\n🎉 管理员接口测试完成！');

  } catch (error) {
    console.error('💥 测试过程中出现错误:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保API服务器正在运行');
      console.log('   可以运行: npm run dev');
    }
  }
}

// 测试特定用户重置功能
async function testUserReset() {
  console.log('\n🔄 测试用户数据重置功能...\n');

  try {
    // 首先获取一个用户ID进行测试
    const usersStatsResponse = await makeRequest(`${API_BASE}/admin/users-stats`);

    if (usersStatsResponse.data.code === 200 && usersStatsResponse.data.data.userStats.length > 0) {
      const userId = usersStatsResponse.data.data.userStats[0].user.id;
      const nickname = usersStatsResponse.data.data.userStats[0].user.nickname;

      console.log(`🎯 测试重置用户: ${nickname} (${userId})`);

      // 测试金额重置
      console.log('\n1. 测试金额重置...');
      const resetAmountResponse = await makeRequest(`${API_BASE}/admin/system-manage`, {
        method: 'PUT',
        body: {
          userId: userId,
          resetType: 'amount_only'
        }
      });

      console.log(`   状态码: ${resetAmountResponse.status}`);
      if (resetAmountResponse.data.code === 200) {
        console.log(`   ✅ 金额重置成功: ${resetAmountResponse.data.message}`);
        console.log(`      处理记录数: ${resetAmountResponse.data.data.processedCount}`);
      } else {
        console.log(`   ❌ 错误: ${resetAmountResponse.data.message}`);
      }

      // 测试记录删除
      console.log('\n2. 测试记录删除...');
      const deleteResponse = await makeRequest(`${API_BASE}/admin/system-manage`, {
        method: 'PUT',
        body: {
          userId: userId,
          resetType: 'delete_all'
        }
      });

      console.log(`   状态码: ${deleteResponse.status}`);
      if (deleteResponse.data.code === 200) {
        console.log(`   ✅ 记录删除成功: ${deleteResponse.data.message}`);
        console.log(`      删除记录数: ${deleteResponse.data.data.processedCount}`);
      } else {
        console.log(`   ❌ 错误: ${deleteResponse.data.message}`);
      }

    } else {
      console.log('⚠️  没有找到用户进行测试');
    }
  } catch (error) {
    console.error('💥 用户重置测试失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🧪 管理员接口测试脚本');
  console.log('==========================================');

  // 检查环境变量
  if (ADMIN_TOKEN === 'your_admin_jwt_token_here') {
    console.log('⚠️  警告: 使用的是默认管理员Token，请设置有效的管理员JWT Token');
    console.log('   可以通过环境变量 ADMIN_TOKEN 设置\n');
  }

  await testAdminAPI();
  await testUserReset();

  console.log('\n==========================================');
  console.log('✨ 所有测试完成！');

  console.log('\n📋 可用的管理员接口:');
  console.log('1. ✅ GET  /api/admin                 - 管理员接口根路径');
  console.log('2. ✅ GET  /api/admin/users-stats     - 用户统计');
  console.log('3. ✅ GET  /api/admin/batch-initialize- 批量初始化预览');
  console.log('4. ✅ POST /api/admin/batch-initialize- 批量初始化执行');
  console.log('5. ✅ GET  /api/admin/system-manage   - 系统管理统计');
  console.log('6. ✅ POST /api/admin/system-manage   - 清空数据库');
  console.log('7. ✅ PUT  /api/admin/system-manage   - 重置用户数据');
  console.log('8. ✅ GET  /api/admin/data-export     - 数据导出');
  console.log('9. ✅ POST /api/admin/data-export     - 自定义查询导出');
  console.log('10. ✅ GET  /api/admin/monitor        - 系统监控');
  console.log('11. ✅ POST /api/admin/monitor        - 系统日志');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAdminAPI,
  testUserReset
};