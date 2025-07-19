<template>
  <div v-if="showWhiteboard" class="whiteboard-container">
    <el-button class="close-btn" @click="showWhiteboard = false" circle size="small" type="danger" style="position: absolute; right: 18px; top: 18px; z-index: 10">×</el-button>
    <el-row class="toolbar" justify="start" align="middle">
      <el-button-group>
        <el-tooltip content="画笔" placement="bottom">
          <el-button :type="tool === 'pen' ? 'primary' : 'default'" @click="selectTool('pen')">
            <el-icon><edit /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="矩形" placement="bottom">
          <el-button :type="tool === 'rect' ? 'primary' : 'default'" @click="selectTool('rect')">
            <el-icon><crop /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="圆形" placement="bottom">
          <el-button :type="tool === 'circle' ? 'primary' : 'default'" @click="selectTool('circle')">
            <el-icon><circle-check /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="文本" placement="bottom">
          <el-button :type="tool === 'text' ? 'primary' : 'default'" @click="selectTool('text')">
            <el-icon><document /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="撤销" placement="bottom">
          <el-button :disabled="!canUndo" @click="undo">
            <el-icon><back /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="重做" placement="bottom">
          <el-button :disabled="!canRedo" @click="redo">
            <el-icon><right /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="导出图片" placement="bottom">
          <el-button @click="exportImage">
            <el-icon><picture /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="清空" placement="bottom">
          <el-button @click="clearCanvas">
            <el-icon><back /></el-icon>
          </el-button>
        </el-tooltip>
      </el-button-group>
    </el-row>
    <div class="canvas-wrapper" @mousemove="sendCursor">
      <canvas ref="canvasBgEl" width="600" height="400" style="width: 600px; height: 400px" class="whiteboard-canvas"></canvas>
      <!-- <canvas ref="canvasFgEl" width="600" height="400" class="whiteboard-canvas fg-layer"></canvas> -->
      <UserCursor v-for="(c, uid) in positions" :key="uid" :user-id="uid" :color="getColor(uid)" :x="c.x" :y="c.y" />
    </div>
    <el-timeline>
      <el-timeline-item v-for="op in opHistory" :key="op._id || op.timestamp" :timestamp="formatTime(op.timestamp)">
        <text>{{ op.operationType }}</text>
        <text> by </text>
        <text>{{ op.userId }}</text>
      </el-timeline-item>
    </el-timeline>
    <el-button @click="startVoice" style="margin: 8px 0"><text>🎤 语音命令</text></el-button>
    <div v-if="voiceStatus" class="voice-feedback">{{ voiceStatus }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, watch } from "vue"
import { ElButton, ElButtonGroup, ElTooltip, ElRow, ElIcon } from "element-plus"
import { Edit, Crop, CircleCheck, Document, Back, Right, Picture } from "@element-plus/icons-vue"
let fabric
import socketSync from "../socketSync"
import * as tf from "@tensorflow/tfjs"
import UserCursor from "./UserCursor.vue"
import { useUserPositions } from "../socketSync"
import { storeToRefs } from "pinia"

const tool = ref("pen")
const canvasEl = ref(null)
const history = reactive({ stack: [], index: -1 })
const canUndo = ref(false)
const canRedo = ref(false)
const cursors = ref({})
const userId = socketSync.userId
const opHistory = ref([])
const voiceStatus = ref("")
let recognition = null

const canvasBgEl = ref(null)
const canvasFgEl = ref(null)
let bgCanvas = null
let fgCanvas = null
let fgCtx = null
let bgCtx = null
let animationFrame = null
let needsRender = false
let isRestoring = false

// 预留：如需路径平滑可用动态 import worker

function selectTool(t) {
  tool.value = t
  if (bgCanvas) {
    bgCanvas.isDrawingMode = (t === 'pen')
  }
}

function clearCanvas() {
  if (bgCanvas) {
    bgCanvas.clear()
    bgCanvas.backgroundColor = "#fff"
    pushHistory()
  }
}

function pushHistory() {
  if (isRestoring) return
  if (bgCanvas) {
    history.stack = history.stack.slice(0, history.index + 1)
    history.stack.push(JSON.stringify(bgCanvas.toJSON()))
    history.index = history.stack.length - 1
    updateUndoRedo()
    console.log("pushHistory", history.stack, history.index)
  }
}

function updateUndoRedo() {
  canUndo.value = history.index > 0
  canRedo.value = history.index < history.stack.length - 1
}

function undo() {
  if (canUndo.value && bgCanvas) {
    isRestoring = true
    history.index--
    bgCanvas.loadFromJSON(history.stack[history.index], () => {
      isRestoring = false
      bgCanvas.discardActiveObject()
      bgCanvas.requestRenderAll()
      console.log("undo", bgCanvas.toJSON())
    })
    updateUndoRedo()
  }
}

function redo() {
  if (canRedo.value && bgCanvas) {
    isRestoring = true
    history.index++
    bgCanvas.loadFromJSON(history.stack[history.index], () => {
      isRestoring = false
      bgCanvas.discardActiveObject()
      bgCanvas.requestRenderAll()
      console.log("redo", bgCanvas.toJSON())
    })
    updateUndoRedo()
  }
}

function exportImage() {
  if (bgCanvas) {
    const url = bgCanvas.toDataURL({ format: "png" })
    const a = document.createElement("a")
    a.href = url
    a.download = "whiteboard.png"
    a.click()
  }
}

const userPositionsStore = useUserPositions()
const { positions } = storeToRefs(userPositionsStore)
const colorMap = {}
function getColor(uid) {
  if (!colorMap[uid]) {
    // 生成稳定颜色
    const palette = ["#f40", "#09f", "#0c0", "#f80", "#a0f", "#0cc", "#fa0", "#888"]
    let hash = 0
    for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) % palette.length
    colorMap[uid] = palette[hash]
  }
  return colorMap[uid]
}
function sendCursor(e) {
  const rect = e.target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  socketSync.sendCursorThrottled(x, y, "用户" + userId.slice(-4), getColor(userId))
}

function scheduleRender() {
  if (!needsRender) {
    needsRender = true
    animationFrame = requestAnimationFrame(renderAll)
  }
}

function renderAll() {
  needsRender = false
  // 只重绘主canvas，临时交互在fgCanvas
  if (bgCanvas) bgCanvas.renderAll && bgCanvas.renderAll()
}

let drawingObject = null
let isDrawing = false

let shapeModel = null
async function loadShapeModel() {
  try {
    if (!shapeModel) {
      shapeModel = await tf.loadLayersModel("/shape-model/model.json")
    }
  } catch (e) {
    console.warn("AI模型加载失败，可忽略", e)
    shapeModel = null
  }
}
async function recognizeAndReplaceShape(obj) {
  if (!shapeModel) return
  // 假设 obj 为 fabric.Path，获取点坐标
  const points = obj.path.map((p) => [p[1], p[2]]).flat()
  const input = tf.tensor([points])
  const pred = shapeModel.predict(input)
  const label = pred.argMax(-1).dataSync()[0]
  // 0:rect, 1:circle, 2:triangle
  let newObj = null
  if (label === 0) {
    // 替换为标准矩形
    newObj = new fabric.Rect({
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height,
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
    })
  } else if (label === 1) {
    newObj = new fabric.Circle({
      left: obj.left,
      top: obj.top,
      radius: Math.max(obj.width, obj.height) / 2,
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
    })
  } else if (label === 2) {
    newObj = new fabric.Triangle({
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height,
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
    })
  }
  if (newObj) {
    obj.canvas.add(newObj)
    obj.canvas.remove(obj)
  }
}

function startVoice() {
  if (!("webkitSpeechRecognition" in window)) return
  recognition = new window.webkitSpeechRecognition()
  recognition.lang = "en-US"
  recognition.continuous = false
  recognition.interimResults = false
  recognition.onstart = () => {
    voiceStatus.value = "🎤 语音识别中..."
  }
  recognition.onend = () => {
    voiceStatus.value = ""
  }
  recognition.onresult = (event) => {
    const cmd = event.results[0][0].transcript.trim().toLowerCase()
    voiceStatus.value = `识别到: ${cmd}`
    if (cmd.includes("add rectangle")) {
      // 添加矩形
      tool.value = "rect"
    } else if (cmd.includes("undo")) {
      undo()
    } else if (cmd.includes("change color")) {
      // 示例：切换颜色
      // 可扩展为弹窗或随机色
      if (bgCanvas) bgCanvas.freeDrawingBrush.color = "#" + Math.floor(Math.random() * 16777215).toString(16)
    }
    setTimeout(() => {
      voiceStatus.value = ""
    }, 1500)
  }
  recognition.start()
}

const showWhiteboard = ref(true)

onMounted(async () => {
  const fabricModule = await import("fabric")
  fabric = fabricModule.default || fabricModule.fabric || fabricModule
  loadShapeModel()
  // 主canvas用于绘制
  console.log('canvasBgEl', canvasBgEl.value)
  bgCanvas = new fabric.Canvas(canvasBgEl.value, {
    isDrawingMode: false,
    selection: true,
    backgroundColor: "#fff",
    renderOnAddRemove: false,
  })
  console.log('bgCanvas', bgCanvas)
  // 监听主canvas变化，所有变更都记录历史
  bgCanvas.on("object:added", pushHistory)
  bgCanvas.on("object:removed", pushHistory)
  bgCanvas.on("object:modified", pushHistory)
  bgCanvas.on("path:created", () => {
    console.log('path created')
    pushHistory()
  })
  pushHistory() // 画布初始状态入栈
  // 鼠标事件
  bgCanvas.on("mouse:down", (opt) => {
    const { x, y } = bgCanvas.getPointer(opt.e)
    isDrawing = true
    if (tool.value === "rect") {
      drawingObject = new fabric.Rect({
        left: x,
        top: y,
        width: 1,
        height: 1,
        fill: "rgba(0,0,0,0.1)",
        stroke: "#333",
        strokeWidth: 2,
      })
      bgCanvas.add(drawingObject)
    } else if (tool.value === "circle") {
      drawingObject = new fabric.Circle({
        left: x,
        top: y,
        radius: 1,
        fill: "rgba(0,0,0,0.1)",
        stroke: "#333",
        strokeWidth: 2,
      })
      bgCanvas.add(drawingObject)
    } else if (tool.value === "text") {
      drawingObject = new fabric.IText("文本", {
        left: x,
        top: y,
        fontSize: 24,
        fill: "#333",
      })
      bgCanvas.add(drawingObject)
      drawingObject.enterEditing()
      isDrawing = false
      drawingObject = null
    }
    // 画笔模式不处理，isDrawingMode 已自动处理
  })
  bgCanvas.on("mouse:move", (opt) => {
    if (!isDrawing || !drawingObject) return
    const { x, y } = bgCanvas.getPointer(opt.e)
    if (tool.value === "rect") {
      drawingObject.set({
        width: Math.abs(x - drawingObject.left),
        height: Math.abs(y - drawingObject.top),
      })
      drawingObject.setCoords()
      bgCanvas.requestRenderAll()
    } else if (tool.value === "circle") {
      const r = Math.sqrt(Math.pow(x - drawingObject.left, 2) + Math.pow(y - drawingObject.top, 2))
      drawingObject.set({ radius: r })
      drawingObject.setCoords()
      bgCanvas.requestRenderAll()
    }
  })
  bgCanvas.on("mouse:up", () => {
    if (tool.value === "rect" || tool.value === "circle") {
      isDrawing = false
      drawingObject = null
    }
    // 画笔模式不处理
  })
  // 支持键盘删除选中对象
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && bgCanvas) {
      const active = bgCanvas.getActiveObject()
      if (active) {
        bgCanvas.remove(active)
      }
    }
  })
  socketSync.connect()
  socketSync.socket.on("cursor", (data) => {
    cursors.value[data.userId] = data
  })
  socketSync.socket.on("operation", (op) => {
    opHistory.value.push(op)
    scheduleRender()
  })
})

onBeforeUnmount(() => {
  if (bgCanvas) bgCanvas.dispose()
  if (animationFrame) cancelAnimationFrame(animationFrame)
})

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString()
}
</script>

<style scoped>
:root {
  --brand: #3b82f6;
  --brand-light: #e0edff;
  --text-main: #222;
  --text-sub: #666;
}
.whiteboard-container {
  max-width: 900px;
  margin: 32px auto 0 auto;
  padding: 24px 16px 32px 16px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.08), 0 1.5px 6px rgba(0, 0, 0, 0.03);
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  color: var(--text-main);
  position: relative;
  /* 不设置 width:100vw/height:100vh/position:fixed/z-index */
}
.close-btn {
  font-size: 22px;
  font-weight: bold;
  background: #fff;
  border: 1.5px solid #e0e0e0;
  color: #f40;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: background 0.2s;
}
.close-btn:hover {
  background: #ffeaea;
  color: #d00;
}
.toolbar {
  margin-bottom: 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 8px 12px;
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 8px;
}
.el-button-group .el-button {
  border-radius: 50%;
  width: 40px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  background: #fff;
  transition: box-shadow 0.2s, background 0.2s;
  margin: 0 2px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.el-button-group .el-button:hover {
  background: var(--brand-light);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.13);
}
.el-button-group .el-button:active {
  background: var(--brand);
  color: #fff;
}
.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(180deg, #f7f8fa 80%, #e0edff 100%);
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding: 18px 8px;
  overflow-x: auto;
  position: relative;
  min-height: 420px;
}
.whiteboard-canvas {
  border: 1.5px solid #e0e0e0;
  background: #fff;
  border-radius: 10px;
  max-width: 100%;
  height: auto;
  box-shadow: 0 1.5px 8px rgba(0, 0, 0, 0.04);
}
.fg-layer {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}
.remote-cursor {
  position: absolute;
  pointer-events: none;
}
.cursor-dot {
  width: 8px;
  height: 8px;
  background: #f40;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
}
.cursor-name {
  font-size: 12px;
  color: #333;
  margin-left: 4px;
}
.el-timeline {
  margin: 28px 0 0 0;
  padding-left: 0;
}
.el-timeline-item {
  font-size: 15px;
  color: var(--text-sub);
  background: none;
  border: none;
  margin-bottom: 8px;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
}
.el-timeline-item__node {
  background: var(--brand) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.13);
}
.voice-feedback {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
@media (max-width: 900px) {
  .whiteboard-container {
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
    padding: 8px 2vw 24px 2vw;
    box-shadow: none;
  }
  .canvas-wrapper {
    padding: 6px 0;
    min-height: 220px;
  }
  .whiteboard-canvas {
    width: 100% !important;
    height: auto !important;
    max-width: 100vw;
  }
  .toolbar {
    padding: 4px 2px;
    border-radius: 8px;
    font-size: 17px;
  }
  .el-button-group .el-button {
    width: 48px;
    height: 48px;
    font-size: 22px;
  }
}
</style>
