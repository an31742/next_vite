// 检查指定用户的所有交易记录
const { MongoClient } = require('mongodb');

async function checkUserTransactions(userId) {
  const uri = "mongodb+srv://an31742:212314@cluster0.2xk4dyf.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ 成功连接到 MongoDB');

    const db = client.db('accounting_app');
    const transactions = db.collection('transactions');
    const users = db.collection('users');

    // 查找用户
    const user = await users.findOne({ id: userId });
    if (!user) {
      console.log('❌ 未找到用户:', userId);
      return;
    }

    console.log('👤 用户信息:');
    console.log('   ID:', user.id);
    console.log('   OpenID:', user.openid);
    console.log('   昵称:', user.nickname);
    console.log('   创建时间:', user.createdAt);

    // 查找该用户的所有交易记录
    const userTransactions = await transactions.find({ userId: userId }).sort({ createdAt: -1 }).toArray();

    console.log('\n📊 交易记录:');
    console.log('   总数:', userTransactions.length);

    if (userTransactions.length > 0) {
      console.log('\n   最近的交易:');
      userTransactions.slice(0, 5).forEach((transaction, index) => {
        console.log(`   ${index + 1}. ${transaction.type === 'income' ? '收入' : '支出'} ¥${transaction.amount}`);
        console.log(`      分类: ${transaction.categoryId}`);
        console.log(`      日期: ${transaction.date}`);
        console.log(`      备注: ${transaction.note || '无'}`);
        console.log(`      时间: ${transaction.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   该用户暂无交易记录');
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await client.close();
    console.log('🔒 已断开数据库连接');
  }
}

// 使用方法
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.log('请提供用户ID作为参数，例如:');
    console.log('node check-user-transactions.js 用户ID');
    process.exit(1);
  }

  checkUserTransactions(userId);
}

module.exports = { checkUserTransactions };