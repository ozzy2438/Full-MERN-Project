// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Removed deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connection successful: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
