const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || true,
      credentials: true,
    })
  );

  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    '/api/',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
    })
  );

  app.use('/api', apiRoutes);

  // Serve frontend static files
  const frontendPath = path.join(__dirname, '../../frontend');
  app.use(express.static(frontendPath));

  // SPA-style page routes
  const pages = [
    'index.html',
    'movie.html',
    'seats.html',
    'confirmation.html',
    'bookings.html',
    'admin.html',
    'login.html',
    'register.html',
  ];

  pages.forEach((page) => {
    const route = page === 'index.html' ? '/' : `/${page.replace('.html', '')}`;
    app.get(route, (req, res) => {
      res.sendFile(path.join(frontendPath, page === 'index.html' ? 'index.html' : `pages/${page}`));
    });
  });

  // Also serve pages folder assets under /pages
  app.use('/pages', express.static(path.join(frontendPath, 'pages')));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
