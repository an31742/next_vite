<template>
  <div class="debug-overlay">
    <div><text>⏱️ 网络延迟: </text>{{ latency }}<text> ms</text></div>
    <div><text>📦 未同步操作: </text>{{ unsyncedOps }}</div>
    <div><text>💾 内存占用: </text>{{ memoryMB }}<text> MB</text></div>
    <div><text>🎨 Canvas FPS: </text>{{ fps }}</div>
    <div><text>👥 活跃用户: </text>{{ userCount }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import socketSync, { useUserPositions } from "../socketSync"
import { storeToRefs } from "pinia"

const latency = ref(0)
const unsyncedOps = ref(0)
const memoryMB = ref(0)
const fps = ref(0)
const userCount = ref(1)

const userPositionsStore = useUserPositions()
const { positions } = storeToRefs(userPositionsStore)

let lastFrame = performance.now()
let frameCount = 0
let fpsTimer = null

function updateFPS() {
  const now = performance.now()
  frameCount++
  if (now - lastFrame >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastFrame = now
  }
  fpsTimer = requestAnimationFrame(updateFPS)
}

function updateStats() {
  // 网络延迟
  const start = Date.now()
  socketSync.socket.emit("ping", () => {
    latency.value = Date.now() - start
  })
  // 未同步操作数（假设 opBatch）
  unsyncedOps.value = socketSync.opBatch ? socketSync.opBatch.length : 0
  // 内存占用
  if (performance && performance.memory) {
    memoryMB.value = (performance.memory.usedJSHeapSize / 1048576).toFixed(1)
  }
  // 活跃用户
  userCount.value = Object.keys(positions.value).length
}

let interval = null
onMounted(() => {
  updateFPS()
  interval = setInterval(updateStats, 1000)
})
onUnmounted(() => {
  if (fpsTimer) cancelAnimationFrame(fpsTimer)
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.debug-overlay {
  position: fixed;
  right: 16px;
  top: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 14px;
  padding: 12px 18px;
  border-radius: 8px;
  line-height: 1.8;
  pointer-events: none;
}
</style>
