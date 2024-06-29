const express = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

const app = express();

app.use(express.json());

app.get('/status', (res, req) => {
  AppController.getStatus(res, req);
});

app.get('/stats', (res, req) => {
  AppController.getStats(res, req);
});

app.post('/users', (res, req) => {
  UsersController.postNew(res, req);
});

module.exports = app;
