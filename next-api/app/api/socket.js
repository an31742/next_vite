import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Operation from '../../models/Operation'
import { applyCRDT } from '../../crdtMiddleware'
import rateLimit from '../../rateLimit'

let io
export default async function handler(req, res) {
  if (!io) {
    io = new Server(res.socket.server)
    res.socket.server.io = io

    io.use(async (socket, next) => {
      const token = socket.handshake.auth?.token
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        socket.user = payload
        next()
      } catch {
        next(new Error('认证失败'))
      }
    })

    io.on('connection', (socket) => {
      const { roomId, userId } = socket.user
      socket.join(roomId)

      // 光标同步
      socket.on('cursor', data => {
        socket.to(roomId).emit('cursor', data)
      })

      // 操作同步
      socket.on('operation', rateLimit(socket, async (op) => {
        const merged = await applyCRDT(op)
        await Operation.create(merged)
        socket.to(roomId).emit('operation', merged)
      }))
    })
  }
  res.end()
} 