import { NextResponse } from "next/server"
import { getDb } from "../_db"
import { COLLECTIONS, DEFAULT_CATEGORIES } from "../../../types/accounting"
import { successResponse, errorResponse, handleApiError } from "../../../utils/db"

export async function POST() {
  try {
    const db = await getDb()

    console.log('开始清空记账本数据库...')

    // 清空所有记账相关的集合
    await db.collection(COLLECTIONS.TRANSACTIONS).deleteMany({})
    console.log('已清空交易记录')

    await db.collection(COLLECTIONS.CATEGORIES).deleteMany({})
    console.log('已清空分类数据')

    await db.collection(COLLECTIONS.USERS).deleteMany({})
    console.log('已清空用户数据')

    await db.collection(COLLECTIONS.SYNC_LOGS).deleteMany({})
    console.log('已清空同步日志')

    // 重新初始化默认分类
    const categoriesWithTimestamp = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    await db.collection(COLLECTIONS.CATEGORIES).insertMany(categoriesWithTimestamp)
    console.log('已重新初始化默认分类')

    return NextResponse.json(
      successResponse('记账本数据库清空并初始化成功', {
        clearedCollections: [
          COLLECTIONS.TRANSACTIONS,
          COLLECTIONS.CATEGORIES,
          COLLECTIONS.USERS,
          COLLECTIONS.SYNC_LOGS
        ],
        initializedCategories: DEFAULT_CATEGORIES.length
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
