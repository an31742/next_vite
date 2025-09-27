import { NextResponse } from "next/server"
import { getDb } from "../_db"
import { COLLECTIONS } from "../../../types/accounting"
import { successResponse, errorResponse, handleApiError } from "../../../utils/db"

export async function POST() {
  try {
    const db = await getDb()

    console.log('开始清空记账本所有数据...')

    // 清空所有记账相关的集合
    const deleteResults = await Promise.all([
      db.collection(COLLECTIONS.TRANSACTIONS).deleteMany({}),
      db.collection(COLLECTIONS.CATEGORIES).deleteMany({}),
      db.collection(COLLECTIONS.USERS).deleteMany({}),
      db.collection(COLLECTIONS.SYNC_LOGS).deleteMany({})
    ])

    const totalDeleted = deleteResults.reduce((sum, result) => sum + result.deletedCount, 0)

    console.log(`已清空所有数据，共删除 ${totalDeleted} 条记录`)

    return NextResponse.json(
      successResponse('记账本数据库已完全清空', {
        deletedCounts: {
          transactions: deleteResults[0].deletedCount,
          categories: deleteResults[1].deletedCount,
          users: deleteResults[2].deletedCount,
          syncLogs: deleteResults[3].deletedCount
        },
        totalDeleted
      })
    )
  } catch (error) {
    console.error('清空数据库失败:', error)
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const db = await getDb()

    // 获取各集合的数据统计
    const stats = await Promise.all([
      db.collection(COLLECTIONS.TRANSACTIONS).countDocuments(),
      db.collection(COLLECTIONS.CATEGORIES).countDocuments(),
      db.collection(COLLECTIONS.USERS).countDocuments(),
      db.collection(COLLECTIONS.SYNC_LOGS).countDocuments()
    ])

    return NextResponse.json(
      successResponse('数据库统计信息', {
        collections: {
          transactions: stats[0],
          categories: stats[1],
          users: stats[2],
          syncLogs: stats[3]
        },
        totalRecords: stats.reduce((sum, count) => sum + count, 0)
      })
    )
  } catch (error) {
    console.error('获取数据库统计失败:', error)
    return NextResponse.json(
      handleApiError(error),
      { status: 500 }
    )
  }
}