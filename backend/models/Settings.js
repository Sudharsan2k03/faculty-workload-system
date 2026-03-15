const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  workingDays: { 
    type: [String], 
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] 
  },
  saturdayMode: { 
    type: String, 
    enum: ['None', 'All', 'Alternate'], 
    default: 'None' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
