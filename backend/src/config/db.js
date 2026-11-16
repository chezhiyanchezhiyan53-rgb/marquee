const dns = require('node:dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback to system resolver
}
const mongoose = require('mongoose');

let transactionsSupported = false;

async function connectDB(uri) {
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and configure your MongoDB connection.'
    );
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  });

  // Detect whether the deployment supports multi-document transactions
  // (requires a replica set or sharded cluster — Atlas does; standalone local usually does not)
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ hello: 1 });
    transactionsSupported = Boolean(info.setName) || info.msg === 'isdbgrid';
  } catch {
    transactionsSupported = false;
  }

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  console.log(
    transactionsSupported
      ? 'Transactions: SUPPORTED (replica set / Atlas)'
      : 'Transactions: NOT SUPPORTED on this deployment (standalone). Booking uses atomic unique-index fallback.'
  );

  return mongoose.connection;
}

function supportsTransactions() {
  return transactionsSupported;
}

module.exports = { connectDB, supportsTransactions };
