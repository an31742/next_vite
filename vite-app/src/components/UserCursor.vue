<template>
  <div class="user-cursor" :style="cursorStyle">
    <svg width="24" height="24">
      <circle :cx="12" :cy="12" r="8" :fill="color" />
    </svg>
    <span class="user-label">{{ userId }}</span>
  </div>
</template>

<script setup>
import { computed, watch, ref } from "vue"
const props = defineProps({
  userId: String,
  color: String,
  x: Number,
  y: Number,
})
const pos = ref({ x: props.x, y: props.y })
watch(
  () => [props.x, props.y],
  ([nx, ny]) => {
    // 平滑动画
    const start = { ...pos.value }
    const end = { x: nx, y: ny }
    const duration = 120
    const startTime = performance.now()
    function animate(now) {
      const t = Math.min((now - startTime) / duration, 1)
      pos.value.x = start.x + (end.x - start.x) * t
      pos.value.y = start.y + (end.y - start.y) * t
      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }
)
const cursorStyle = computed(() => ({
  position: "absolute",
  left: pos.value.x + "px",
  top: pos.value.y + "px",
  pointerEvents: "none",
  transition: "none",
  zIndex: 10,
}))
</script>

<style scoped>
.user-cursor {
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: bold;
  user-select: none;
}
.user-label {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 4px;
  padding: 2px 6px;
  margin-left: 2px;
}
</style>
