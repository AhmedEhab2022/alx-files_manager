const fs = require('fs');
const uuid = require('uuid');
const mime = require('mime-types');
const Bull = require('bull');
const { ObjectId } = require('mongodb');
const path = require('path');
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
      parentId: parentId ? new ObjectId(parentId) : 0,
      isPublic: isPublic || false,
      data,
    };
    if (type !== 'folder') {
      const path = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
      // Generate a unique filename
      const filePath = `${path}/${uuid.v4()}`;
      // decode the base64 string
      const data = Buffer.from(file.data, 'base64');
      // Write the file to the filesystem
      fs.writeFileSync(filePath, data);
      file.localPath = filePath;
    }
    if (type === 'image') {
      const queue = new Bull('images');
      await queue.add({ userId, fileId: file._id });
      this.postProcessImage(file);
    }
    const newFile = await dbClient.createFile(file);
    return res.status(201).send({ id: newFile._id, ...file });
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
    if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });
    return res.status(200).send({ id: file._id, ...file });
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
    for (const file of files) {
      file.id = file._id;
      delete file._id;
    }
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
    if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });
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
    if (file.userId.toString() !== userId) return res.status(404).send({ error: 'Not found' });
    const updatedFile = await dbClient.updateFileById(fileId, { isPublic: false });
    return res.status(200).send(updatedFile);
  }

  static async getFile(req, res) {
    try {
      const fileId = req.params.id;
      const token = req.header('X-Token');
      const userId = token ? await redisClient.get(`auth_${token}`) : null;

      const file = await dbClient.findFileById(fileId);
      if (!file) return res.status(404).send({ error: 'Not found' });

      // Check if the file is public or the user is authenticated and the owner
      if (!file.isPublic && (!userId || userId !== file.userId.toString())) {
        return res.status(404).send({ error: 'Not found' });
      }

      if (file.type === 'folder') {
        return res.status(400).send({ error: "A folder doesn't have content" });
      }

      const filePath = path.resolve(file.localPath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send({ error: 'Not found' });
      }

      // Set the Content-Type response header based on the file type
      const mimeType = mime.lookup(filePath);
      res.setHeader('Content-Type', mimeType);
      // Read the file content
      const fileContent = fs.readFileSync(filePath);
      // Send the file content in the response
      return res.status(200).send(fileContent);
    } catch (error) {
      console.error('Error fetching file:', error);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
