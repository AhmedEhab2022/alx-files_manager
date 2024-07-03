const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const queue = new Bull('images');
const imageProcessor = async (job) => {
  const { userId, fileId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');
  const user = await dbClient.findUserById(userId);
  if (!user) throw new Error('User not found');
  const file = await dbClient.findFileById(fileId);
  if (!file) throw new Error('File not found');
  // Generate 3 thumbnails with width 500, 250, and 100 pixels
  const sizes = [500, 250, 100];
  const thumbnails = {};
  await Promise.all(sizes.map(async (size) => {
    try {
      const thumbnail = await imageThumbnail(file.localPath, { width: size });
      thumbnails[size] = thumbnail.toString('base64');
    } catch (error) {
      console.log(error);
    }
  }));
  // Update the file in the database
  await dbClient.updateFileById(fileId, { thumbnails });
};

queue.process(imageProcessor);

module.exports = queue;
