import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI as string
const dbName = process.env.DB_NAME as string

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function getDb() {
  if (cachedDb) return cachedDb
  if (!uri) throw new Error('Missing MONGODB_URI')
  if (!dbName) throw new Error('Missing DB_NAME')
  const client = new MongoClient(uri)
  await client.connect()
  cachedClient = client
  cachedDb = client.db(dbName)
  return cachedDb
} 