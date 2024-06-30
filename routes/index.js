const express = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get('/files/:id', (res, req) => {
  FilesController.getShow(res, req);
});

app.get('/files', (res, req) => {
  FilesController.getIndex(res, req);
});

app.put('/files/:id/publish', (res, req) => {
  FilesController.putPublish(res, req);
});

app.put('/files/:id/unpublish', (res, req) => {
  FilesController.putUnpublish(res, req);
});

app.get('/files/:id/data', (res, req) => {
  FilesController.getFile(res, req);
});

module.exports = app;
