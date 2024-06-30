const express = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

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

app.get('/users/me', (res, req) => {
  UsersController.getMe(res, req);
});

app.get('/connect', (res, req) => {
  AuthController.getConnect(res, req);
});

app.get('/disconnect', (res, req) => {
  AuthController.getDisconnect(res, req);
});

app.post('/files', (res, req) => {
  FilesController.postUpload(res, req);
});

module.exports = app;
