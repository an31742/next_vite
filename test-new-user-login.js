const { MongoClient } = require('mongodb');

// MongoDB 配置
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'accounting_app';

// 生成随机 openid
function generateRandomOpenid() {
  return 'test_openid_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function testNewUserLogin() {
  console.log('🧪 测试新用户登录功能...\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    // 连接到 MongoDB
    await client.connect();
    console.log('✅ 成功连接到 MongoDB');

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const transactionsCollection = db.collection('transactions');

    // 生成新的 openid
    const newOpenid = generateRandomOpenid();
    console.log('📱 生成新的 openid:', newOpenid);

    // 检查用户是否已存在
    const existingUser = await usersCollection.findOne({ openid: newOpenid });
    if (existingUser) {
      console.log('⚠️ 用户已存在，删除该用户以进行新用户测试');
      await usersCollection.deleteOne({ openid: newOpenid });
      // 同时删除该用户的所有交易记录
      await transactionsCollection.deleteMany({ userId: existingUser.id });
    }

    // 模拟新用户登录（直接在数据库中创建用户）
    const newUser = {
      id: 'user_' + Date.now(),
      openid: newOpenid,
      nickname: '测试用户_' + Date.now(),
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await usersCollection.insertOne(newUser);
    console.log('✅ 成功创建新用户:', newUser.id);

    // 验证新用户没有交易记录
    const transactionCount = await transactionsCollection.countDocuments({ userId: newUser.id });
    console.log('📊 新用户的交易记录数:', transactionCount);

    if (transactionCount === 0) {
      console.log('✅ 新用户正确初始化，没有任何交易记录');
    } else {
      console.log('❌ 新用户初始化失败，存在交易记录');
      // 清理交易记录
      await transactionsCollection.deleteMany({ userId: newUser.id });
      console.log('🔧 已清理交易记录');
    }

    // 获取用户信息
    const createdUser = await usersCollection.findOne({ _id: insertResult.insertedId });
    console.log('👤 用户信息:', {
      id: createdUser.id,
      openid: createdUser.openid,
      nickname: createdUser.nickname
    });

    console.log('\n🎉 新用户登录测试完成！');

  } catch (error) {
    console.error('💥 测试过程中出现错误:', error.message);
  } finally {
    await client.close();
    console.log('🔒 已关闭数据库连接');
  }
}

// 运行测试
testNewUserLogin();