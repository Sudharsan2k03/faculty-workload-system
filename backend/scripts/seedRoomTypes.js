const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RoomType = require('../models/RoomType');

dotenv.config();

const seedRoomTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected to seed room types...');

    const initialTypes = [
      { typeName: 'Lecture Hall', description: 'Standard classroom for lectures' },
      { typeName: 'Lab', description: 'Practical session laboratory' },
      { typeName: 'Seminar Hall', description: 'Hall for seminars and presentations' },
      { typeName: 'Auditorium', description: 'Large hall for events' },
      { typeName: 'Conference Room', description: 'Room for meetings' },
      { typeName: 'Smart Classroom', description: 'Classroom with digital equipment' }
    ];

    for (const type of initialTypes) {
      await RoomType.findOneAndUpdate(
        { typeName: type.typeName },
        type,
        { upsert: true, new: true }
      );
    }

    console.log('Room types seeded successfully');
    process.exit();
  } catch (err) {
    console.error('Error seeding room types:', err);
    process.exit(1);
  }
};

seedRoomTypes();
