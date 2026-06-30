// backend/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI; // acepta ambos nombres

  if (!uri) {
    throw new Error('Falta MONGODB_URI/MONGO_URI en las variables de entorno');
  }

  // LOG seguro para confirmar qué se está leyendo (no imprime la pass)
  const safe = uri.replace(/(\/\/[^:]+:)[^@]+@/, '$1********@');
  console.log('🔌 Usando MONGO URI:', safe);

  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB Atlas');
};

module.exports = { connectDB };
