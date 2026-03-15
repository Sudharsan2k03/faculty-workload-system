require("dotenv").config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require("path");


connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/workloads', require('./routes/workloadRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/room-types', require('./routes/roomTypeRoutes'));

// Serve React frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
