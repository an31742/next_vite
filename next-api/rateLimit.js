const userOps = new Map()
export default function rateLimit(socket, handler) {
  return async function (...args) {
    const now = Date.now()
    const key = socket.user.userId
    if (!userOps.has(key)) userOps.set(key, [])
    const arr = userOps.get(key).filter((ts) => now - ts < 1000)
    if (arr.length > 20) return
    arr.push(now)
    userOps.set(key, arr)
    await handler(...args)
  }
}
