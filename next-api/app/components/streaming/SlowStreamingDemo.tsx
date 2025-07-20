import { fetchSlowData } from '@/lib/streaming/mockData'

export default async function SlowComponent() {
  const data = await fetchSlowData()
  return (
    <div className="p-4 bg-yellow-100 rounded-lg">
      <h3 className="text-lg font-semibold">慢速数据加载</h3>
      <p>{data.data}</p>
      <p className="text-sm text-gray-500">加载时间: {data.timestamp}</p>
    </div>
  )
}