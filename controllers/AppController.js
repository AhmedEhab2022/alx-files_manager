const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
  static getStatus(request, response) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    response.status(200).send(status);
  }

  static getStats(request, response) {
    const stats = {
      users: dbClient.nbUsers(),
      files: dbClient.nbFiles(),
    };
    response.status(200).send(stats);
  }
}

module.exports = AppController;
