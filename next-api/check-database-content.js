#!/usr/bin/env node

/**
 * 检查数据库中的所有数据
 * 查看用户表和交易表的实际情况
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// 数据库配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'accounting_app';

async function checkDatabaseContent() {
  let client;

  try {
    console.log('🔍 开始检查数据库内容...\n');

    // 连接数据库
    console.log('📦 正在连接数据库...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    console.log(`✅ 已连接到数据库: ${DB_NAME}`);

    // 1. 列出所有集合
    console.log('\n📋 数据库中的集合:');
    const collections = await db.listCollections().toArray();
    console.log(`发现 ${collections.length} 个集合:`);
    collections.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.name}`);
    });

    // 2. 检查每个集合的文档数量
    console.log('\n📊 各集合文档统计:');
    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`  ${col.name}: ${count} 个文档`);
    }

    // 3. 检查transactions集合详情
    if (collections.some(col => col.name === 'transactions')) {
      console.log('\n💰 Transactions 集合详情:');
      const transactionsCollection = db.collection('transactions');

      // 总数统计
      const totalTransactions = await transactionsCollection.countDocuments();
      const activeTransactions = await transactionsCollection.countDocuments({ deletedAt: { $exists: false } });
      const deletedTransactions = await transactionsCollection.countDocuments({ deletedAt: { $exists: true } });

      console.log(`  总交易记录: ${totalTransactions}`);
      console.log(`  活跃记录: ${activeTransactions}`);
      console.log(`  已删除记录: ${deletedTransactions}`);

      // 按用户统计
      if (activeTransactions > 0) {
        console.log('\n  按用户分组统计:');
        const userStats = await transactionsCollection.aggregate([
          {
            $match: { deletedAt: { $exists: false } }
          },
          {
            $group: {
              _id: '$userId',
              totalAmount: { $sum: '$amount' },
              incomeAmount: {
                $sum: {
                  $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                }
              },
              expenseAmount: {
                $sum: {
                  $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                }
              },
              count: { $sum: 1 }
            }
          }
        ]).toArray();

        userStats.forEach((stat, index) => {
          console.log(`    用户 ${stat._id.slice(-6)}: 收入¥${stat.incomeAmount}, 支出¥${stat.expenseAmount}, 记录${stat.count}条`);
        });
      }

      // 示例记录
      if (totalTransactions > 0) {
        console.log('\n  示例交易记录:');
        const sampleTransactions = await transactionsCollection.find({}).limit(3).toArray();
        sampleTransactions.forEach((tx, index) => {
          console.log(`    ${index + 1}. 用户${tx.userId?.slice(-6)} - ${tx.type} ¥${tx.amount} (${tx.date})`);
        });
      }
    }

    // 4. 检查users集合详情
    if (collections.some(col => col.name === 'users')) {
      console.log('\n👥 Users 集合详情:');
      const usersCollection = db.collection('users');

      const totalUsers = await usersCollection.countDocuments();
      console.log(`  总用户数: ${totalUsers}`);

      if (totalUsers > 0) {
        console.log('\n  用户列表:');
        const users = await usersCollection.find({}).toArray();
        users.forEach((user, index) => {
          console.log(`    ${index + 1}. ${user.nickname || '未命名'} (${user.id?.slice(-6)}) - ${user.openid?.slice(-6)}`);
        });
      }
    }

    // 5. 检查categories集合
    if (collections.some(col => col.name === 'categories')) {
      console.log('\n🏷️ Categories 集合详情:');
      const categoriesCollection = db.collection('categories');

      const totalCategories = await categoriesCollection.countDocuments();
      console.log(`  总分类数: ${totalCategories}`);

      if (totalCategories > 0) {
        const incomeCategories = await categoriesCollection.countDocuments({ type: 'income' });
        const expenseCategories = await categoriesCollection.countDocuments({ type: 'expense' });
        console.log(`  收入分类: ${incomeCategories}`);
        console.log(`  支出分类: ${expenseCategories}`);
      }
    }

    // 6. 总结
    console.log('\n='.repeat(60));
    console.log('📊 数据库状态总结:');

    const transactionsCount = collections.some(col => col.name === 'transactions') ?
      await db.collection('transactions').countDocuments({ deletedAt: { $exists: false } }) : 0;
    const usersCount = collections.some(col => col.name === 'users') ?
      await db.collection('users').countDocuments() : 0;

    if (usersCount === 0 && transactionsCount === 0) {
      console.log('✅ 数据库完全清空 - 所有用户和交易数据已清除');
    } else if (transactionsCount === 0) {
      console.log(`✅ 交易数据已清空 - ${usersCount}个用户记录保留，但无交易数据`);
    } else {
      console.log(`⚠️ 仍有数据 - ${usersCount}个用户，${transactionsCount}条交易记录`);
    }

  } catch (error) {
    console.error('💥 检查过程中出现错误:', error);
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
  console.log('🔍 数据库内容检查工具');
  console.log('==========================================');
  console.log('📊 此工具将检查数据库中的所有数据');
  console.log('🔍 确认重置操作的实际效果');
  console.log('==========================================\n');

  try {
    await checkDatabaseContent();
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
  checkDatabaseContent
};