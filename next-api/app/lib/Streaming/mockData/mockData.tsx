import { getCurrentDateTime } from "../../../../utils/auth"
import { getDb, getCollection } from "../../../../utils/db"
import { COLLECTIONS, Transaction } from "../../../../types/accounting"

// 异步函数，用于获取真实数据，可指定延迟时间，默认100毫秒
export async function fetchSlowData(delay: number = 100) {
  // 使用实际的数据库查询替代模拟延迟
  const db = await getDb()
  const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS)
  // 模拟查询操作
  const count = await transactionsCollection.countDocuments()

  return {
    timestamp: getCurrentDateTime(),
    data: `慢速加载的数据 - 数据库中有 ${count} 条交易记录`,
    delay: delay
  }
}

// 异步函数，用于获取快速加载的真实数据
export async function fetchFastData() {
  // 使用实际的数据库查询
  const db = await getDb()
  const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS)
  // 快速查询操作
  const count = await transactionsCollection.estimatedDocumentCount()

  return {
    timestamp: getCurrentDateTime(),
    data: `快速加载的数据 - 数据库中大约有 ${count} 条交易记录`,
  }
}