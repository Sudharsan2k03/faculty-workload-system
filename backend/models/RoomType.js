const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  typeName: { type: String, required: true, unique: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('RoomType', roomTypeSchema);
