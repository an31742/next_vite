import { getCurrentDateTime } from "utils/auth"

// 异步函数，用于获取慢速加载的数据，可指定延迟时间，默认2000毫秒
export async function fetchSlowData(delay: number = 2000) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    return {
      timestamp: getCurrentDateTime(),
      data: '慢速加载的数据'
    }
  }
  
  // 异步函数，用于获取快速加载的数据
  export async function fetchFastData() {
    return {
      timestamp: getCurrentDateTime(),
      data: '快速加载的数据'
    }
  }