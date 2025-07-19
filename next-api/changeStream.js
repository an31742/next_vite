const mongoose = require("mongoose")
const Operation = require("./models/Operation")
let io = null

// 初始化 Socket.io 实例
function setSocketIO(serverIO) {
  io = serverIO
}

// 启动变更流监听
async function watchOperations() {
  await mongoose.connect(process.env.MONGODB_URI)
  const collection = mongoose.connection.collection("operations")
  const changeStream = collection.watch()
  let opCount = 0

  changeStream.on("change", async (change) => {
    if (change.operationType === "insert") {
      const op = change.fullDocument
      opCount++
      if (io) {
        io.to(op.roomId).emit("operation", op)
      }
      // 每 100 条创建快照
      if (opCount % 100 === 0) {
        await createSnapshot(op.roomId)
      }
    }
  })
}

// 快照逻辑（可自定义存储方式）
async function createSnapshot(roomId) {
  const ops = await Operation.find({ roomId }).sort({ timestamp: 1 })
  // 这里只是简单输出，实际可存储到快照表或文件
  console.log(`[Snapshot] roomId=${roomId}, totalOps=${ops.length}`)
}

module.exports = { watchOperations, setSocketIO }
