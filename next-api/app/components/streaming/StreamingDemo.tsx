import React, { Suspense } from 'react'
import SlowComponent from './SlowStreamingDemo'
import FastComponent from './FastStreamingDemo'
import Loading from './Loading' // 修复文件扩展名错误

// 此组件展示了数据流（Streaming）的工作原理。React 的 Suspense 组件用于处理异步操作，
// 当组件处于挂起状态（例如正在加载数据）时，会显示 fallback 指定的内容。
// 在这个例子中，FastComponent 和 SlowComponent 分别模拟了快速加载和慢速加载的组件。
// 通过 Suspense 包裹这些组件，我们可以实现部分内容先加载显示，其余内容在加载完成后再渲染，
// 这就是数据流渲染的核心思想，提升了用户体验，让用户不必等待所有内容加载完成。
export default function StreamingDemo() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-6">RSC Streaming Demo</h1>
      
      {/* Content that loads quickly */}
      <Suspense fallback={<Loading />}>
        <FastComponent />
      </Suspense>

      {/* Content that loads slowly */}
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>

      {/* Parallel loading example */}
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