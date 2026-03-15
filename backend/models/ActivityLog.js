const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },       // e.g. "Faculty Added"
  description: { type: String, required: true },  // e.g. "Dr. John Smith added to CS"
  module: { 
    type: String, 
    enum: ['Faculty', 'Subject', 'Classroom', 'Department', 'Timetable', 'Workload'],
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
