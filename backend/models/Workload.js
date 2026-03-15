const mongoose = require('mongoose');

const workloadSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  assignedHours: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Workload', workloadSchema);
