import { fetchFastData } from '@/lib/Streaming/mockData/mockData'

export default async function FastComponent() {
  const data = await fetchFastData()
  return (
    <div className="p-4 bg-green-100 rounded-lg">
      <h3 className="text-lg font-semibold">快速数据加载</h3>
      <p>{data.data}</p>
      <p className="text-sm text-gray-500">加载时间: {data.timestamp}</p>
    </div>
  )
}