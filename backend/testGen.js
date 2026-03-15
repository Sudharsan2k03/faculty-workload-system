const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Faculty = require('./models/Faculty');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Classroom = require('./models/Classroom');
const Workload = require('./models/Workload');
const Timetable = require('./models/Timetable');
const { generateTimetable } = require('./controllers/timetableController');

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/faculty_workload');

    // Simulate the request and response object
    const req = {};
    const res = {
        json: (data) => console.log('Response:', data),
        status: (code) => ({
            json: (data) => console.log(`Status ${code}:`, data)
        })
    };

    await generateTimetable(req, res);

    const count = await Timetable.countDocuments();
    console.log('Timetable documents count:', count);
    process.exit();
}

run();
