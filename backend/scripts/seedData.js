const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Workload = require('../models/Workload');
const Classroom = require('../models/Classroom');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const RoomType = require('../models/RoomType');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/faculty_workload');
    console.log('MongoDB Connected');

    // ─── Clear all collections ───────────────────────────────────────────────
    console.log('\nClearing existing collections...');
    await Promise.all([
      Department.deleteMany({}),
      Faculty.deleteMany({}),
      Subject.deleteMany({}),
      Workload.deleteMany({}),
      Classroom.deleteMany({}),
      Timetable.deleteMany({}),
      User.deleteMany({}),
      RoomType.deleteMany({})
    ]);

    // ─── Admin user ──────────────────────────────────────────────────────────
    await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: 'adminpassword',
      role: 'admin'
    });
    console.log('Admin user created: admin@college.edu / adminpassword');

    // ─── Room Types ──────────────────────────────────────────────────────────
    console.log('\nInserting room types...');
    const roomTypesList = [
      { typeName: 'Lecture Hall', description: 'Standard classroom for lectures' },
      { typeName: 'Lab', description: 'Practical session laboratory' },
      { typeName: 'Seminar Hall', description: 'Hall for seminars and presentations' },
      { typeName: 'Auditorium', description: 'Large hall for events' },
      { typeName: 'Conference Room', description: 'Room for meetings' },
      { typeName: 'Smart Classroom', description: 'Classroom with digital equipment' }
    ];
    const createdRoomTypes = await RoomType.insertMany(roomTypesList);
    
    const getType = (name) => createdRoomTypes.find(t => t.typeName === name)?._id;

    // ─── Departments ─────────────────────────────────────────────────────────
    // ... (rest of the script)
    console.log('\nInserting departments...');
    await Department.insertMany([
      { departmentId: 'CS',   name: 'Computer Science', description: 'Computer Science & Engineering' },
      { departmentId: 'MATH', name: 'Mathematics',      description: 'Mathematics Department' },
      { departmentId: 'PHY',  name: 'Physics',          description: 'Physics Department' },
      { departmentId: 'CHEM', name: 'Chemistry',        description: 'Chemistry Department' },
      { departmentId: 'DS',   name: 'Data Science',     description: 'Data Science Department' }
    ]);

    // ─── Faculty & Faculty Logins ────────────────────────────────────────────
    console.log('Inserting faculty and creating login accounts...');
    const facultyData = [
      { facultyId: 'F001', name: 'Dr. John Smith',   department: 'Computer Science', designation: 'Professor',           email: 'john.smith@college.edu',  maxWorkloadHours: 20 },
      { facultyId: 'F002', name: 'Alice Johnson',     department: 'Mathematics',      designation: 'Assistant Professor', email: 'alice.j@college.edu',     maxWorkloadHours: 15 },
      { facultyId: 'F003', name: 'Dr. Robert Brown',  department: 'Physics',          designation: 'Associate Professor', email: 'robert.b@college.edu',    maxWorkloadHours: 18 },
      { facultyId: 'F004', name: 'Dr. Priya Sharma',  department: 'Chemistry',        designation: 'Professor',           email: 'priya.s@college.edu',     maxWorkloadHours: 16 },
      { facultyId: 'F005', name: 'Mark Wilson',        department: 'Data Science',     designation: 'Assistant Professor', email: 'mark.w@college.edu',      maxWorkloadHours: 14 }
    ];

    for (const f of facultyData) {
      const faculty = await Faculty.create(f);
      await User.create({
        name: faculty.name,
        email: faculty.email,
        password: 'password123',
        role: 'faculty',
        facultyId: faculty._id
      });
    }

    // ─── Subjects ────────────────────────────────────────────────────────────
    console.log('Inserting subjects...');
    await Subject.insertMany([
      { subjectId: 'CS101',   subjectName: 'Algorithms',        department: 'Computer Science', hoursPerWeek: 4 },
      { subjectId: 'CS102',   subjectName: 'Data Structures',   department: 'Computer Science', hoursPerWeek: 4 },
      { subjectId: 'MATH101', subjectName: 'Calculus I',        department: 'Mathematics',      hoursPerWeek: 3 },
      { subjectId: 'MATH102', subjectName: 'Linear Algebra',    department: 'Mathematics',      hoursPerWeek: 3 },
      { subjectId: 'PHY101',  subjectName: 'General Physics',   department: 'Physics',          hoursPerWeek: 4 },
      { subjectId: 'CHEM101', subjectName: 'Organic Chemistry', department: 'Chemistry',        hoursPerWeek: 3 },
      { subjectId: 'DS101',   subjectName: 'Machine Learning',  department: 'Data Science',     hoursPerWeek: 4 }
    ]);

    // ─── Classrooms ──────────────────────────────────────────────────────────
    console.log('Inserting classrooms...');
    await Classroom.insertMany([
      { roomId: 'LH-101',  roomName: 'Lecture Hall A',        roomType: getType('Lecture Hall'), capacity: 120 },
      { roomId: 'LH-102',  roomName: 'Lecture Hall B',        roomType: getType('Lecture Hall'), capacity: 100 },
      { roomId: 'LAB-201', roomName: 'Computer Science Lab',  roomType: getType('Lab'),          capacity: 40  },
      { roomId: 'LAB-202', roomName: 'Physics Lab',           roomType: getType('Lab'),          capacity: 30  },
      { roomId: 'SH-301',  roomName: 'Seminar Hall 1',        roomType: getType('Seminar Hall'), capacity: 60  },
      { roomId: 'SH-302',  roomName: 'Seminar Hall 2',        roomType: getType('Seminar Hall'), capacity: 50  }
    ]);

    console.log('\n✅ All data seeded successfully!');
    console.log('   Admin login: admin@college.edu / adminpassword');
    console.log('   Faculty login: (email) / password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seedData();
