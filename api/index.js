const { createApp } = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');

let isConnected = false;

async function ensureConnection() {
  if (!isConnected) {
    await connectDB(process.env.MONGODB_URI);
    isConnected = true;
  }
}

module.exports = async (req, res) => {
  await ensureConnection();
  const app = createApp();
  return app(req, res);
};
