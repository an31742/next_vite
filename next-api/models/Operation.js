const mongoose = require('mongoose')

const OperationSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  operationType: { type: String, enum: ['draw', 'move', 'text', 'delete'], required: true },
  data: { type: Object, required: true },
  vectorClock: { type: Map, of: Number },
  timestamp: { type: Date, default: Date.now },
})

module.exports = mongoose.models.Operation || mongoose.model('Operation', OperationSchema) 