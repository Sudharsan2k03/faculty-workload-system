const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error.message.includes('bad auth') || error.code === 8000) {
      console.error('\n❌ MongoDB Authentication Failed:');
      console.error('The username or password in MONGO_URI in backend/.env is incorrect.');
      console.error('Please verify your Database User credentials in MongoDB Atlas (Database Access -> Database Users).\n');
    } else {
      console.error(`MongoDB Connection Error: ${error.message}`);
    }
    process.exit(1);
  }
};

module.exports = connectDB;
