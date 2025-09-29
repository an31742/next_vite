const { MongoClient } = require('mongodb');

// 数据库配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'accounting_app';

async function testDatabaseConnection() {
  let client;

  try {
    console.log('正在连接数据库...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    console.log(`成功连接到数据库: ${DB_NAME}`);

    // 测试查询用户集合
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`用户集合中有 ${userCount} 个用户`);

    // 如果没有用户，创建一个测试用户
    if (userCount === 0) {
      console.log('创建测试用户...');
      await usersCollection.insertOne({
        id: 'test_user_1',
        openid: 'test_openid_1',
        nickname: '测试用户',
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('测试用户创建成功');
    }

    console.log('数据库连接测试完成');
  } catch (error) {
    console.error('数据库连接失败:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('数据库连接已关闭');
    }
  }
}

testDatabaseConnection();