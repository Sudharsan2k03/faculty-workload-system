const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  departmentId: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
