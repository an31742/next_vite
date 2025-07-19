import { io } from "socket.io-client"
import * as Y from "yjs"
import * as msgpack from "msgpack-lite"
import { defineStore } from "pinia"
import { markRaw } from "vue"

// Pinia store for user positions
export const useUserPositions = defineStore("userPositions", {
  state: () => ({ positions: {} }),
  actions: {
    setPosition(userId, pos) {
      this.positions[userId] = pos
    },
    setAllPositions(obj) {
      this.positions = obj
    },
  },
})

const socket = io("/api/socket", {
  transports: ["websocket"],
  autoConnect: false,
})

const ydoc = new Y.Doc()
const pendingOps = []
const userId = `${Math.random().toString(36).slice(2, 10)}`
let lastTimestamp = Date.now()

// 批量操作队列
let opBatch = []
let batchTimer = null
const BATCH_INTERVAL = 40 // ms

function connect() {
  if (!socket.connected) socket.connect()
}
function disconnect() {
  if (socket.connected) socket.disconnect()
}

function broadcastOp(type, data) {
  const timestamp = Date.now()
  const op = { type, data, userId, timestamp }
  opBatch.push(op)
  if (!batchTimer) {
    batchTimer = setTimeout(() => {
      const batch = opBatch.splice(0)
      // delta-state CRDT: 只发送 yjs updateV2
      const deltas = batch.map((o) => o.data.yjsUpdate)
      const packed = msgpack.encode({ ops: batch.map((o) => ({ ...o, data: undefined })), deltas })
      socket.emit("operation-batch", packed)
      batchTimer = null
    }, BATCH_INTERVAL)
  }
}

function handleRemoteBatch(packed) {
  const { ops, deltas } = msgpack.decode(packed)
  deltas.forEach((delta, i) => {
    Y.applyUpdateV2(ydoc, delta)
    // 触发本地回调
    if (ops[i]) handleRemoteOp({ ...ops[i], data: { yjsUpdate: delta } })
  })
}

function handleRemoteOp(op) {
  if (op.data && op.data.yjsUpdate) {
    Y.applyUpdateV2(ydoc, op.data.yjsUpdate)
  }
}

// 本地 yjs 更新批量广播
ydoc.on("updateV2", (update, origin) => {
  if (origin === "remote") return
  broadcastOp("yjs-update", { yjsUpdate: update })
})

// 兼容 yjs v1 事件
ydoc.on("update", (update, origin) => {
  if (origin === "remote") return
  broadcastOp("yjs-update", { yjsUpdate: update })
})

// --- Cursor Sync ---
let lastCursorSend = 0
export function sendCursorThrottled(x, y, name, color) {
  const now = Date.now()
  if (now - lastCursorSend > 100) {
    socket.emit("cursor", { userId, x, y, name, color })
    lastCursorSend = now
  }
}

// 事件处理内部动态获取 store，避免顶层调用
socket.on("cursor", (data) => {
  const store = useUserPositions()
  store.setPosition(data.userId, data)
})

socket.on("operation-batch", handleRemoteBatch)

export default {
  connect,
  disconnect,
  ydoc,
  socket,
  userId,
  broadcastOp,
  sendCursorThrottled,
}
