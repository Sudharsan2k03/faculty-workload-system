const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/faculty_workload');
    
    const adminExists = await User.findOne({ email: 'admin@college.edu' });
    
    if (adminExists) {
      console.log('Admin already exists');
      process.exit();
    }
    
    await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: 'adminpassword',
      role: 'admin'
    });
    
    console.log('Admin user created: admin@college.edu / adminpassword');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
