const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  async del(key) {
    this.client.del(key, (err, reply) => {
      if (err) {
        console.log(err);
      } else if (reply === 1) {
        console.log(`Key "${key}" deleted successfully`);
      } else {
        console.log(`Key "${key}" does not exist`);
      }
    });
  }
}

const redisClient = RedisClient();

module.exports = redisClient;
