// backend/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI; // Support both environment variable names

  if (!uri) {
    throw new Error('MONGODB_URI or MONGO_URI is missing from the environment');
  }

  // Log a redacted URI to confirm which database is being used
  const safe = uri.replace(/(\/\/[^:]+:)[^@]+@/, '$1********@');
  console.log('🔌 Using MongoDB URI:', safe);

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas');
};

module.exports = { connectDB };
