const fs = require('fs');
const uuid = require('uuid');
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
      parentId: parentId || 0,
      isPublic: isPublic || false,
      data: data || null,
    };
    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
      // Generate a unique filename
      const filePath = path.join(folderPath, uuid.v4());
      // Decode the base64 data
      const fileData = Buffer.from(data, 'base64');
      // Write the file to the filesystem
      fs.writeFileSync(filePath, fileData);
      file.localPath = filePath;
    }
    const newFile = await dbClient.createFile(file);
    return res.status(201).send(newFile);
  }
}

module.exports = FilesController;
