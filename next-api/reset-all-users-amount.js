#!/usr/bin/env node

/**
 * 重置所有用户的收入和支出金额为0
 * 这个脚本将直接操作数据库，将所有用户的所有交易记录的金额设置为0
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

async function resetAllUsersAmount() {
  let client;

  try {
    console.log('🚀 开始重置所有用户的收入和支出金额...\n');

    // 连接数据库
    console.log('📦 正在连接数据库...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    const transactionsCollection = db.collection(COLLECTIONS.TRANSACTIONS);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    console.log('✅ 数据库连接成功');

    // 1. 获取所有用户统计
    console.log('\n📊 正在获取所有用户的当前统计信息...');

    const userStats = await transactionsCollection.aggregate([
      {
        $match: {
          deletedAt: { $exists: false }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]).toArray();

    console.log(`📈 发现 ${userStats.length} 个有交易记录的用户`);

    // 显示当前统计
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransactions = 0;

    userStats.forEach((stat, index) => {
      totalIncome += stat.totalIncome;
      totalExpense += stat.totalExpense;
      totalTransactions += stat.transactionCount;

      console.log(`  ${index + 1}. 用户 ${stat._id.slice(-6)}: 收入¥${stat.totalIncome.toFixed(2)}, 支出¥${stat.totalExpense.toFixed(2)} (${stat.transactionCount}条记录)`);
    });

    console.log(`\n📊 当前总计:`);
    console.log(`   总收入: ¥${totalIncome.toFixed(2)}`);
    console.log(`   总支出: ¥${totalExpense.toFixed(2)}`);
    console.log(`   总余额: ¥${(totalIncome - totalExpense).toFixed(2)}`);
    console.log(`   总交易记录: ${totalTransactions}条`);

    // 2. 如果没有需要重置的数据，直接返回
    if (userStats.length === 0) {
      console.log('\n✅ 所有用户的金额已经是0，无需重置');
      return;
    }

    // 3. 执行重置操作
    console.log('\n🔄 正在重置所有用户的交易金额为0...');

    const updateResult = await transactionsCollection.updateMany(
      {
        deletedAt: { $exists: false },
        amount: { $ne: 0 } // 只更新金额不为0的记录
      },
      {
        $set: {
          amount: 0,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ 重置完成！更新了 ${updateResult.modifiedCount} 条交易记录`);

    // 4. 验证重置结果
    console.log('\n🔍 正在验证重置结果...');

    const afterStats = await transactionsCollection.aggregate([
      {
        $match: {
          deletedAt: { $exists: false }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]).toArray();

    // 检查是否还有非零金额
    const nonZeroUsers = afterStats.filter(stat => stat.totalIncome !== 0 || stat.totalExpense !== 0);

    if (nonZeroUsers.length === 0) {
      console.log('✅ 验证成功！所有用户的收入和支出金额已重置为0');
      console.log(`📊 保留了 ${afterStats.reduce((sum, stat) => sum + stat.transactionCount, 0)} 条交易记录（金额为0）`);
    } else {
      console.log(`⚠️ 警告！仍有 ${nonZeroUsers.length} 个用户的金额未正确重置:`);
      nonZeroUsers.forEach(stat => {
        console.log(`   用户 ${stat._id.slice(-6)}: 收入¥${stat.totalIncome}, 支出¥${stat.totalExpense}`);
      });
    }

    // 5. 更新所有用户的更新时间
    console.log('\n🔄 正在更新用户记录的最后更新时间...');

    const usersWithTransactions = userStats.map(stat => stat._id);
    const usersUpdateResult = await usersCollection.updateMany(
      {
        id: { $in: usersWithTransactions }
      },
      {
        $set: {
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ 已更新 ${usersUpdateResult.modifiedCount} 个用户记录`);

    // 6. 最终总结
    console.log('\n🎉 重置操作完成！');
    console.log('==========================================');
    console.log('📊 操作摘要:');
    console.log(`   重置前用户数: ${userStats.length}`);
    console.log(`   重置前总收入: ¥${totalIncome.toFixed(2)}`);
    console.log(`   重置前总支出: ¥${totalExpense.toFixed(2)}`);
    console.log(`   更新的交易记录: ${updateResult.modifiedCount}条`);
    console.log(`   更新的用户记录: ${usersUpdateResult.modifiedCount}个`);
    console.log(`   重置后总金额: ¥0.00`);
    console.log('==========================================');

    console.log('\n✨ 所有用户的收入和支出已成功重置为0！');

  } catch (error) {
    console.error('💥 重置过程中出现错误:', error);

    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 提示: 无法连接到数据库');
      console.log('   请检查 MONGODB_URI 环境变量是否正确');
      console.log('   当前配置: ' + MONGODB_URI);
    }

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
  console.log('💰 用户金额重置工具');
  console.log('==========================================');
  console.log('⚠️ 警告: 此操作将把所有用户的收入和支出金额重置为0');
  console.log('⚠️ 注意: 交易记录结构将保留，仅金额变为0');
  console.log('==========================================\n');

  // 检查环境变量
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ 警告: 未设置 MONGODB_URI 环境变量，使用默认值');
  }

  if (!process.env.DB_NAME) {
    console.log('⚠️ 警告: 未设置 DB_NAME 环境变量，使用默认值');
  }

  console.log(`📦 数据库连接: ${MONGODB_URI}`);
  console.log(`📊 数据库名称: ${DB_NAME}\n`);

  try {
    await resetAllUsersAmount();
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
  resetAllUsersAmount
};