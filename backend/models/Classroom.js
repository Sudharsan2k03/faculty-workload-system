const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  roomName: { type: String, required: true },
  roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  capacity: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Classroom', classroomSchema);
