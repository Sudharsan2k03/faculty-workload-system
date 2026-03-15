const Classroom = require('../models/Classroom');
const Timetable = require('../models/Timetable');
const logActivity = require('../utils/logActivity');

const getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({}).populate('roomType');
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClassroom = async (req, res) => {
  try {
    const { roomId, roomName, capacity, roomType } = req.body;

    const classroomExists = await Classroom.findOne({ roomId });
    if (classroomExists) {
      return res.status(400).json({ message: 'Room ID already exists' });
    }

    const classroom = await Classroom.create({
      roomId,
      roomName,
      capacity,
      roomType
    });

    await logActivity('Classroom Added', `"${roomName}" registered with capacity ${capacity}`, 'Classroom');
    res.status(201).json(classroom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClassroom = async (req, res) => {
    try {
      const classroom = await Classroom.findById(req.params.id);
  
      if (classroom) {
        const { roomId } = req.body;
        if (roomId && roomId !== classroom.roomId) {
          const exists = await Classroom.findOne({ roomId });
          if (exists) {
            return res.status(400).json({ message: 'Room ID already exists' });
          }
          classroom.roomId = roomId;
        }

        classroom.roomName = req.body.roomName || classroom.roomName;
        classroom.capacity = req.body.capacity || classroom.capacity;
        classroom.roomType = req.body.roomType || classroom.roomType;
  
        const updatedClassroom = await classroom.save();
        await logActivity('Classroom Updated', `"${updatedClassroom.roomName}" details updated`, 'Classroom');
        res.json(updatedClassroom);
      } else {
        res.status(404).json({ message: 'Classroom not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (classroom) {
      await Timetable.deleteMany({ classroom: classroom._id });
      await Classroom.findByIdAndDelete(req.params.id);
      await logActivity('Classroom Deleted', `"${classroom.roomName}" removed from registry`, 'Classroom');
      res.json({ message: 'Classroom removed' });
    } else {
      res.status(404).json({ message: 'Classroom not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClassrooms, createClassroom, updateClassroom, deleteClassroom };
