import { Suspense } from 'react'
import SlowComponent from './SlowStreamingDemo'
import FastComponent from './FastStreamingDemo'
import Loading from './Loading.'

export default function StreamingDemo() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-6">RSC 流式传输演示</h1>
      
      {/* 快速加载的内容 */}
      <Suspense fallback={<Loading />}>
        <FastComponent />
      </Suspense>

      {/* 慢速加载的内容 */}
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>

      {/* 并行加载示例 */}
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<Loading />}>
          <FastComponent />
        </Suspense>
        <Suspense fallback={<Loading />}>
          <SlowComponent />
        </Suspense>
      </div>
    </div>
  )
}