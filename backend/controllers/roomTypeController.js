const RoomType = require('../models/RoomType');
const logActivity = require('../utils/logActivity');

exports.getRoomTypes = async (req, res) => {
  try {
    const roomTypes = await RoomType.find().sort({ typeName: 1 });
    res.json(roomTypes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRoomType = async (req, res) => {
  const { typeName, description } = req.body;
  try {
    const existing = await RoomType.findOne({ typeName });
    if (existing) return res.status(400).json({ message: 'Room type already exists' });

    const roomType = new RoomType({ typeName, description });
    await roomType.save();
    await logActivity('Room Type Added', `New room type "${typeName}" created`, 'RoomType');
    res.status(201).json(roomType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateRoomType = async (req, res) => {
  try {
    const roomType = await RoomType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(roomType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteRoomType = async (req, res) => {
  try {
    await RoomType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room type deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
