const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Faculty = require('./models/Faculty');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Classroom = require('./models/Classroom');
const Workload = require('./models/Workload');
const Timetable = require('./models/Timetable');

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/faculty_workload');

    // Test logic for John Smith
    const user = await User.findOne({ email: 'john.smith@college.edu' });
    console.log("Faculty User ID:", user.facultyId);

    const faculty = await Faculty.findById(user.facultyId);
    console.log("Faculty Name:", faculty?.name);

    const timetables = await Timetable.find({ faculty: faculty._id }).populate('subject').populate('classroom');
    console.log('Timetables length:', timetables.length);
    if (timetables.length > 0) {
        console.log('Sample timetable slot:', timetables[0].day, timetables[0].timeSlot, timetables[0].subject.subjectName);
    }
    process.exit();
}

run();
