require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { createApp } = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET is not set. Copy .env.example to .env');
      process.exit(1);
    }

    await connectDB(process.env.MONGODB_URI);
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`CineBook server running at http://localhost:${PORT}`);
      console.log(`API health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start CineBook server:');
    console.error(err.message);
    console.error(
      '\nTip: Ensure MongoDB is running locally or configure MONGODB_URI for Atlas in .env'
    );
    process.exit(1);
  }
}

start();
