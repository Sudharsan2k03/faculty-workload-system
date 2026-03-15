const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Classroom = require('../models/Classroom');
const RoomType = require('../models/RoomType');

dotenv.config();

const migrateClassrooms = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for migration...');

    const classrooms = await Classroom.find({});
    const roomTypes = await RoomType.find({});

    console.log(`Found ${classrooms.length} classrooms and ${roomTypes.length} room types.`);

    for (const room of classrooms) {
      // Check if roomType is already an ObjectId
      if (mongoose.Types.ObjectId.isValid(room.roomType)) {
          // It might be a valid ObjectId but does it exist in RoomTypes?
          const exists = await RoomType.findById(room.roomType);
          if (exists) {
            console.log(`Classroom ${room.roomName} already has a valid roomType reference.`);
            continue;
          }
      }

      // If it's a string (like 'Lecture Hall'), try to match it
      const match = roomTypes.find(t => t.typeName.split(' ')[0] === String(room.roomType).split(' ')[0]);
      
      if (match) {
        room.roomType = match._id;
        await room.save();
        console.log(`Migrated classroom ${room.roomName} to roomType: ${match.typeName}`);
      } else {
        // Fallback to first available type if no match
        if (roomTypes.length > 0) {
          room.roomType = roomTypes[0]._id;
          await room.save();
          console.log(`Set default roomType for classroom ${room.roomName}: ${roomTypes[0].typeName}`);
        }
      }
    }

    console.log('Migration completed successfully');
    process.exit();
  } catch (err) {
    console.error('Error during migration:', err);
    process.exit(1);
  }
};

migrateClassrooms();
