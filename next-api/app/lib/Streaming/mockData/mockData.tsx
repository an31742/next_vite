export async function fetchSlowData(delay: number = 2000) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    return {
      timestamp: new Date().toISOString(),
      data: 'Slow loaded data'
    }
  }
  
  export async function fetchFastData() {
    return {
      timestamp: new Date().toISOString(),
      data: 'Fast loaded data'
    }
  }