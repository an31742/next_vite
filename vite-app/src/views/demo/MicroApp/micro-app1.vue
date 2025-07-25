<template>
  <div class="micro-app1">
    <h1>Hello from Micro App 1</h1>
    <p>{{ message }}</p>
    <!-- 新增：显示从主应用接收的数据 -->
    <div v-if="masterData" class="master-data">
      <h3>主应用数据:</h3>
      <pre>{{ masterData }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
const message = ref("这是Vue子应用1")
// 新增：存储主应用发送的数据
const masterData = ref(null)

// 内部状态管理函数
const updateInternalState = (newData) => {
  message.value = newData;
  // 可以在这里添加本地存储或其他内部处理
  console.log('子应用内部状态已更新:', newData);
}

// 初始化通信客户端
initSandboxClient().then(messenger => {
  // 发送加载完成消息
  messenger.send('app-loaded', {
    appName: 'app1',
    loadedTime: new Date().toISOString(),
    initialState: message.value // 发送子应用初始信息
  });

  // 监听主应用消息
  // 修改为DOM加载完成后注册监听器
  document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('sandbox-message-data-update', (e) => {
      console.log('收到主应用数据更新:', e.detail);
      masterData.value = e.detail;
      updateInternalState(`[${new Date().toLocaleTimeString()}] 收到更新: ${e.detail.message}`);
    });
    console.log('子应用事件监听器已注册');
  });

  // 请求数据
  messenger.send('data-request', { key: 'user-info' });

  // 新增：定时发送子应用状态（示例）
  const statusInterval = setInterval(() => {
    messenger.send('app-status', {
      active: true,
      timestamp: new Date().toISOString(),
      currentState: message.value
    });
  }, 5000);

  // 清理函数
  onUnmounted(() => {
    clearInterval(statusInterval);
    messenger.send('app-unloaded', { appName: 'app1' });
  });
});

onMounted(() => {
  // 子应用内部信息传递示例
  setTimeout(() => {
    updateInternalState("子应用内部状态更新");
  }, 3000);
});
</script>

<style scoped>
.micro-app1 { padding: 20px; background-color: #f5f5f5; }
.master-data { margin-top: 15px; padding: 10px; background: #e6f7ff; border-radius: 4px; }
</style>
