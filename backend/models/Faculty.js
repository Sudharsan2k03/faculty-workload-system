const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  facultyId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  maxWorkloadHours: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);
