require('@babel/polyfill/noConflict');
const cookieParser = require('cookie-parser');
const secure = require('express-force-https');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'config/local.env', debug: true });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();
const express = server.express;

// enforce HTTPS for all URLS
express.use(secure);

// Use express middleware to handle cookies (JTW)
express.use(cookieParser());

// decode JWT to get user ID with every req
express.use((req, res, next) => {
  // get the token from req
  const { token } = req.cookies;

  if (token) {
    // get the userId, use verify & secret to make sure not modified
    const { userId } = jwt.verify(token, process.env.APP_SECRET);

    // add the userId to req for future requests
    req.userId = userId;

    // console.log('USERID', userId);
  }
  next();
});

server.start(
  {
    port: process.env.PORT || 4444,
    cors: {
      credentials: true,
      origin: [
        process.env.FRONTEND_URL,
        'https://adventure-tracker-frontend.netlify.com',
        'https://www.adventure-tracker.com/',
        'https://main-adventure-tracker.netlify.com/',
        'https://main-adventure-tracker.netlify.com/map',
        'https://main-adventure-tracker.com/',
        /https?:\/\/(localhost:\d+|(deploy-preview-\d+--)?main-adventure-tracker.netlify.com)\/?/,
        /https?:\/\/(localhost:\d+|(\w+--)?main-adventure-tracker.netlify.com)\/?/
      ]
    }
  },
  details => {
    console.log(`Server is now running on http://localhost:${details.port}`);
  }
);
