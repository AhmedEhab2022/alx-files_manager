const fs = require('fs');
const uuid = require('uuid');
const mime = require('mime-types');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.findUserById(userId);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const {
      name,
      type,
      parentId,
      isPublic,
      data,
    } = req.body;

    if (!name) return res.status(400).send({ error: 'Missing name' });
    if (!type) return res.status(400).send({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).send({ error: 'Missing data' });
    if (type !== 'folder' && type !== 'file' && type !== 'image') return res.status(400).send({ error: 'Invalid type' });
    if (parentId) {
      const parent = await dbClient.findFileById(parentId);
      if (!parent) return res.status(400).send({ error: 'Parent not found' });
      if (parent.type !== 'folder') return res.status(400).send({ error: 'Parent is not a folder' });
    }

    const file = {
      userId: user._id,
      name,
      type,
      parentId: parentId || 0,
      isPublic: isPublic || false,
      data,
    };
    if (type !== 'folder') {
      const path = process.env.FOLDER_PATH || './tmp/files_manager';
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
      // Generate a unique filename
      const filePath = `${path}/${uuid.v4()}`;
      // decode the base64 string
      const data = Buffer.from(file.data, 'base64');
      // Write the file to the filesystem
      fs.writeFileSync(filePath, data);
      file.localPath = filePath;
    }
    const newFile = await dbClient.createFile(file);
    return res.status(201).send(newFile);
  }

  static async getShow(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.findUserById(userId);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const fileId = req.params.id;
    const file = await dbClient.findFileById(fileId);
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (file.userId.toString() !== userId) return res.status(403).send({ error: 'Forbidden' });
    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.findUserById(userId);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const { parentId, page } = req.query;
    const files = await dbClient.findFiles({ userId, parentId, page });
    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.findUserById(userId);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const fileId = req.params.id;
    const file = await dbClient.findFileById(fileId);
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (file.userId.toString() !== userId) return res.status(403).send({ error: 'Forbidden' });
    const updatedFile = await dbClient.updateFileById(fileId, { isPublic: true });
    return res.status(200).send(updatedFile);
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.findUserById(userId);
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const fileId = req.params.id;
    const file = await dbClient.findFileById(fileId);
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (file.userId.toString() !== userId) return res.status(403).send({ error: 'Forbidden' });
    const updatedFile = await dbClient.updateFileById(fileId, { isPublic: false });
    return res.status(200).send(updatedFile);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const file = await dbClient.findFileById(fileId);
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (!file.isPublic) return res.status(403).send({ error: 'Forbidden' });
    if (file.type === 'folder') return res.status(400).send({ error: 'A folder doesn\'t have content' });
    const path = file.localPath;
    const mimeType = mime.lookup(path);
    res.setHeader('Content-Type', mimeType);
    return res.status(200).send(fs.readFileSync(path));
  }
}

module.exports = FilesController;
