const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectId: { type: String, required: true, unique: true },
  subjectName: { type: String, required: true },
  department: { type: String, required: true },
  hoursPerWeek: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
