#!/usr/bin/env node

// 测试按日期修改交易记录的接口
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

// 模拟JWT token（实际使用时需要通过登录获取）
const TEST_TOKEN = 'your_jwt_token_here';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testDateBasedOperations() {
  console.log('🧪 开始测试按日期修改交易记录功能...\n');

  const testDate = '2024-01-15'; // 测试日期

  try {
    // 1. 获取指定日期的交易记录
    console.log(`📊 获取 ${testDate} 的交易记录...`);
    const getResponse = await fetch(`${API_BASE}/transactions/date/${testDate}`, {
      headers
    });
    const getData = await getResponse.json();

    if (getData.code === 200) {
      console.log('✅ 获取成功:', JSON.stringify(getData.data.summary, null, 2));
      console.log(`当前有 ${getData.data.transactions.length} 条记录`);
    } else {
      console.log('❌ 获取失败:', getData.message);
    }

    // 2. 向指定日期添加新的交易记录
    console.log(`\n➕ 向 ${testDate} 添加新交易记录...`);
    const addTransactions = [
      {
        type: 'expense',
        amount: 50.0,
        categoryId: 'food',
        note: '午餐费用'
      },
      {
        type: 'income',
        amount: 1000.0,
        categoryId: 'salary',
        note: '兼职收入'
      }
    ];

    const addResponse = await fetch(`${API_BASE}/transactions/date/${testDate}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        transactions: addTransactions,
        updateType: 'addToDate'
      })
    });
    const addData = await addResponse.json();

    if (addData.code === 200) {
      console.log('✅ 添加成功:', JSON.stringify(addData.data, null, 2));
    } else {
      console.log('❌ 添加失败:', addData.message);
    }

    // 3. 再次获取当日记录验证
    console.log(`\n🔍 验证 ${testDate} 的最新记录...`);
    const verifyResponse = await fetch(`${API_BASE}/transactions/date/${testDate}`, {
      headers
    });
    const verifyData = await verifyResponse.json();

    if (verifyData.code === 200) {
      console.log('✅ 验证成功:', JSON.stringify(verifyData.data.summary, null, 2));
      console.log(`现在有 ${verifyData.data.transactions.length} 条记录`);

      // 4. 修改现有记录
      if (verifyData.data.transactions.length > 0) {
        console.log(`\n✏️ 修改现有交易记录...`);
        const firstTransaction = verifyData.data.transactions[0];

        const modifyResponse = await fetch(`${API_BASE}/transactions/date/${testDate}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            transactions: [
              {
                id: firstTransaction.id,
                amount: firstTransaction.amount + 10, // 增加10元
                note: (firstTransaction.note || '') + ' - 已修改'
              }
            ],
            updateType: 'modify'
          })
        });
        const modifyData = await modifyResponse.json();

        if (modifyData.code === 200) {
          console.log('✅ 修改成功:', JSON.stringify(modifyData.data, null, 2));
        } else {
          console.log('❌ 修改失败:', modifyData.message);
        }
      }

      // 5. 替换当日所有记录
      console.log(`\n🔄 替换 ${testDate} 的所有记录...`);
      const replaceTransactions = [
        {
          type: 'expense',
          amount: 25.0,
          categoryId: 'transport',
          note: '地铁费用'
        },
        {
          type: 'expense',
          amount: 80.0,
          categoryId: 'food',
          note: '晚餐费用'
        }
      ];

      const replaceResponse = await fetch(`${API_BASE}/transactions/date/${testDate}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          transactions: replaceTransactions,
          updateType: 'replace'
        })
      });
      const replaceData = await replaceResponse.json();

      if (replaceData.code === 200) {
        console.log('✅ 替换成功:', JSON.stringify(replaceData.data, null, 2));
      } else {
        console.log('❌ 替换失败:', replaceData.message);
      }

    } else {
      console.log('❌ 验证失败:', verifyData.message);
    }

    // 6. 最终验证
    console.log(`\n🎯 最终验证 ${testDate} 的记录...`);
    const finalResponse = await fetch(`${API_BASE}/transactions/date/${testDate}`, {
      headers
    });
    const finalData = await finalResponse.json();

    if (finalData.code === 200) {
      console.log('✅ 最终状态:', JSON.stringify(finalData.data.summary, null, 2));
      console.log('📝 交易记录:');
      finalData.data.transactions.forEach((t, index) => {
        console.log(`  ${index + 1}. ${t.type === 'income' ? '收入' : '支出'}: ${t.amount}元 - ${t.note} (${t.category.name})`);
      });
    } else {
      console.log('❌ 最终验证失败:', finalData.message);
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error.message);
  }
}

// 演示删除功能
async function testDeleteDate() {
  const testDate = '2024-01-15';

  console.log(`\n🗑️ 测试删除 ${testDate} 的所有记录...`);

  try {
    const deleteResponse = await fetch(`${API_BASE}/transactions/date/${testDate}`, {
      method: 'DELETE',
      headers
    });
    const deleteData = await deleteResponse.json();

    if (deleteData.code === 200) {
      console.log('✅ 删除成功:', JSON.stringify(deleteData.data, null, 2));
    } else {
      console.log('❌ 删除失败:', deleteData.message);
    }
  } catch (error) {
    console.error('💥 删除测试失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testDateBasedOperations();
  await testDeleteDate();
}

// 检查是否提供了token
if (TEST_TOKEN === 'your_jwt_token_here') {
  console.log('⚠️ 请先设置有效的JWT token');
  console.log('你可以通过以下方式设置:');
  console.log('1. 修改脚本中的 TEST_TOKEN 变量');
  console.log('2. 或者通过环境变量: TEST_TOKEN=your_token node test-date-operations.js');
  process.exit(1);
} else {
  runTests();
}