// 此文件路径注释表明代码位于 src/utils/sandbox-messaging.ts
// 定义消息负载的类型，T 为泛型，默认为 any 类型
// MessagePayload 用于表示消息的结构
export type MessagePayload<T = any> = {
  // 消息的类型，用字符串表示
  type: string
  // 消息的来源，只能是 "main-app" 或 "micro-app"
  source: "main-app" | "micro-app"
  // 可选的消息数据，类型为泛型 T
  data?: T
}

// 定义监听器的类型，T 为泛型，默认为 any 类型
// Listener 是一个函数类型，接收消息数据和 MessageEvent 作为参数
type Listener<T = any> = (data: T, event: MessageEvent) => void

// 定义 SandboxMessenger 类，用于在不同窗口间进行消息通信
export class SandboxMessenger {
  // 目标窗口对象，消息将发送到该窗口
  private targetWindow: Window
  // 目标窗口的源，用于安全验证
  private origin: string
  // 存储消息类型和对应监听器的映射
  private listeners = new Map<string, Listener>()

  // 构造函数，初始化目标窗口和源，并添加消息监听事件
  constructor(targetWindow: Window, origin: string) {
    this.targetWindow = targetWindow
    this.origin = origin
    // 为当前窗口添加 message 事件监听，处理接收到的消息
    window.addEventListener("message", this.handleMessage)
  }

  // 私有方法，处理接收到的消息事件
  private handleMessage = (event: MessageEvent) => {
    // 验证消息来源是否匹配，不匹配则直接返回
    if (event.origin !== this.origin) return
    // 将事件数据转换为 MessagePayload 类型
    const payload = event.data as MessagePayload
    // 检查数据是否有效，无效则直接返回
    if (!payload || typeof payload !== "object") return
    // 根据消息类型从监听器映射中获取对应的处理函数
    const fn = this.listeners.get(payload.type)
    // 如果存在对应的处理函数，则调用该函数
    if (fn) fn(payload.data, event)
  }

  // 为指定类型的消息添加监听器
  on<T>(type: string, handler: Listener<T>) {
    // 将消息类型和对应的处理函数存入监听器映射中
    this.listeners.set(type, handler)
  }

  // 移除指定类型消息的监听器
  off(type: string) {
    // 从监听器映射中删除指定类型的监听器
    this.listeners.delete(type)
  }

  // 向目标窗口发送消息
  post<T>(type: string, data?: T) {
    // 构造消息负载对象
    const payload: MessagePayload<T> = {
      type,
      source: "main-app",
      data,
    }
    // 调用目标窗口的 postMessage 方法发送消息
    this.targetWindow.postMessage(payload, this.origin)
  }

  // 销毁消息通信器，清理资源
  destroy() {
    // 移除消息监听事件
    window.removeEventListener("message", this.handleMessage)
    // 清空所有监听器
    this.listeners.clear()
  }
}
