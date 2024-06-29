const express = require('express');
const AppController = require('../controllers/AppController');

const app = express();

app.get('/status', (res, req) => {
  AppController.getStatus(res, req);
});
app.get('/stats', (res, req) => {
  AppController.getStats(res, req);
});

module.exports = app;
