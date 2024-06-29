const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  static async getStatus(request, response) {
    const status = {
      redis: await redisClient.isAlive(),
      db: await dbClient.isAlive(),
    };
    response.status(200).send(status);
  }

  static async getStats(request, response) {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    response.status(200).send(stats);
  }
}

module.exports = AppController;
