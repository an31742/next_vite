<!-- 此文件为 src/components/MicroAppIframe.vue，用于实现主应用与子应用通过 iframe 进行消息通信的功能 -->
<template>
  <!-- 页面根容器 -->
  <div>
    <!-- 显示主应用标题 -->
    <h2>主应用</h2>
    <!-- 点击按钮调用 sendMessage 方法，向子应用发送消息 -->
    <button @click="sendMessage">发送消息给子应用</button>
    <!-- 点击按钮调用 destroyMessenger 方法，清除消息监听 -->
    <button @click="destroyMessenger">清除监听</button>

    <!-- 嵌入子应用的 iframe，通过 ref 获取 DOM 元素，src 指定子应用页面路径，设置样式 -->
    <iframe ref="iframeRef" src="/micro-app.html" style="width: 100%; height: 200px; border: 1px solid #ccc"></iframe>
  </div>
</template>

<script setup lang="ts">
// 从 vue 中导入 ref、onMounted 和 onBeforeUnmount 函数
import { ref, onMounted, onBeforeUnmount } from "vue"
// 从指定路径导入 SandboxMessenger 类，用于消息通信
import { SandboxMessenger } from "@/utils/sandBox/messaging.ts"

// 使用 ref 创建响应式引用，用于获取 iframe 的 DOM 元素
const iframeRef = ref<HTMLIFrameElement>()
// 声明一个 SandboxMessenger 类型的变量，初始值为 null
let messenger: SandboxMessenger | null = null

// 在组件挂载完成后执行的生命周期钩子
onMounted(() => {
  // 获取 iframe 的内容窗口对象
  const targetWindow = iframeRef.value?.contentWindow
  // 如果成功获取到内容窗口
  if (targetWindow) {
    // 实例化 SandboxMessenger，传入目标窗口和当前页面的源
    messenger = new SandboxMessenger(targetWindow, location.origin)

    // 监听子应用发送的 "micro-hello" 消息，收到消息后打印日志
    messenger.on("micro-hello", (data) => {
      console.log("[主应用] 收到子应用消息:", data)
    })
  }
})

// 定义发送消息的函数
function sendMessage() {
  // 如果 messenger 存在，向子应用发送 "main-ping" 消息
  messenger?.post("main-ping", { msg: "Hello 子应用 👋" })
}

// 定义清除消息监听的函数
function destroyMessenger() {
  // 如果 messenger 存在，调用其 destroy 方法清除监听
  messenger?.destroy()
}
</script>
