#!/usr/bin/env node

/**
 * 验证所有用户的当前状态
 * 检查所有用户的收入和支出是否已正确重置为0
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// 数据库配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'accounting_app';

// 集合名称
const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  USERS: 'users'
};

async function verifyUsersStatus() {
  let client;

  try {
    console.log('🔍 开始验证所有用户的当前状态...\n');

    // 连接数据库
    console.log('📦 正在连接数据库...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    const transactionsCollection = db.collection(COLLECTIONS.TRANSACTIONS);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    console.log('✅ 数据库连接成功');

    // 1. 获取所有用户
    console.log('\n👥 正在获取所有用户信息...');
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`📊 发现 ${allUsers.length} 个用户`);

    if (allUsers.length === 0) {
      console.log('ℹ️ 系统中暂无用户');
      return;
    }

    // 2. 获取每个用户的交易统计
    console.log('\n📊 正在分析每个用户的交易数据...');

    const userStats = [];

    for (const user of allUsers) {
      const stats = await transactionsCollection.aggregate([
        {
          $match: {
            userId: user.id,
            deletedAt: { $exists: false }
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      const summary = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0
      };

      stats.forEach(stat => {
        if (stat._id === 'income') {
          summary.totalIncome = stat.total;
        } else if (stat._id === 'expense') {
          summary.totalExpense = stat.total;
        }
        summary.transactionCount += stat.count;
      });

      summary.balance = summary.totalIncome - summary.totalExpense;

      userStats.push({
        user: {
          id: user.id,
          nickname: user.nickname || `用户${user.id.slice(-6)}`,
          createdAt: user.createdAt
        },
        summary,
        isNewUser: summary.transactionCount === 0,
        isProperlyInitialized: summary.totalIncome === 0 && summary.totalExpense === 0
      });
    }

    // 3. 显示详细统计
    console.log('\n📋 用户状态详情:');
    console.log('='.repeat(80));

    userStats.forEach((userStat, index) => {
      const { user, summary, isNewUser, isProperlyInitialized } = userStat;

      let statusIcon = '✅';
      let statusText = '已正确初始化';

      if (!isProperlyInitialized) {
        statusIcon = '❌';
        statusText = '需要重置';
      } else if (isNewUser) {
        statusIcon = '🆕';
        statusText = '新用户（无交易）';
      }

      console.log(`${index + 1}. ${statusIcon} ${user.nickname} (${user.id.slice(-6)})`);
      console.log(`   状态: ${statusText}`);
      console.log(`   收入: ¥${summary.totalIncome.toFixed(2)}`);
      console.log(`   支出: ¥${summary.totalExpense.toFixed(2)}`);
      console.log(`   余额: ¥${summary.balance.toFixed(2)}`);
      console.log(`   交易记录: ${summary.transactionCount}条`);
      console.log(`   创建时间: ${user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '未知'}`);
      console.log('');
    });

    // 4. 总体统计
    const totalUsers = userStats.length;
    const newUsers = userStats.filter(u => u.isNewUser).length;
    const initializedUsers = userStats.filter(u => u.isProperlyInitialized).length;
    const needResetUsers = userStats.filter(u => !u.isProperlyInitialized).length;

    const totalIncome = userStats.reduce((sum, u) => sum + u.summary.totalIncome, 0);
    const totalExpense = userStats.reduce((sum, u) => sum + u.summary.totalExpense, 0);
    const totalBalance = totalIncome - totalExpense;
    const totalTransactions = userStats.reduce((sum, u) => sum + u.summary.transactionCount, 0);

    console.log('='.repeat(80));
    console.log('📊 系统总体统计:');
    console.log(`   总用户数: ${totalUsers}`);
    console.log(`   新用户(无交易): ${newUsers}`);
    console.log(`   已正确初始化: ${initializedUsers}`);
    console.log(`   需要重置: ${needResetUsers}`);
    console.log('');
    console.log(`   系统总收入: ¥${totalIncome.toFixed(2)}`);
    console.log(`   系统总支出: ¥${totalExpense.toFixed(2)}`);
    console.log(`   系统总余额: ¥${totalBalance.toFixed(2)}`);
    console.log(`   总交易记录: ${totalTransactions}条`);
    console.log('='.repeat(80));

    // 5. 初始化状态判断
    if (needResetUsers === 0) {
      console.log('\n🎉 验证结果: 所有用户都已正确初始化！');
      console.log('✅ 所有用户的收入和支出金额都是0');

      if (totalTransactions > 0) {
        console.log(`📊 系统保留了${totalTransactions}条历史交易记录（金额为0）`);
      }
    } else {
      console.log(`\n⚠️ 验证结果: 发现${needResetUsers}个用户需要重置`);
      console.log('建议运行重置脚本来修复这些用户的数据');
    }

    // 6. 根据项目规范验证
    console.log('\n📋 项目规范验证:');
    console.log('规范要求: "新用户登录时，支出和收入必须初始化为0，确保每个用户从零开始独立记账"');

    if (initializedUsers === totalUsers) {
      console.log('✅ 符合项目规范: 所有用户都从零开始');
    } else {
      console.log('❌ 不符合项目规范: 存在用户金额不为零');
    }

  } catch (error) {
    console.error('💥 验证过程中出现错误:', error);
    throw error;
  } finally {
    // 关闭数据库连接
    if (client) {
      await client.close();
      console.log('\n📦 数据库连接已关闭');
    }
  }
}

// 主函数
async function main() {
  console.log('🔍 用户状态验证工具');
  console.log('==========================================');
  console.log('📊 此工具将检查所有用户的收支状态');
  console.log('✅ 验证是否符合项目初始化规范');
  console.log('==========================================\n');

  try {
    await verifyUsersStatus();
  } catch (error) {
    console.error('💥 程序执行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  verifyUsersStatus
};