const uuid = require('uuid');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');
    if (!auth) return res.status(401).send({ error: 'Unauthorized' });
    // Remove 'Basic ' from the beginning of the string and decode the base64 string
    const buff = Buffer.from(auth.replace('Basic ', ''), 'base64');
    // Split the decoded string by ':' and create an object with email and password
    const creds = { email: buff.toString('utf-8').split(':')[0], password: buff.toString('utf-8').split(':')[1] };
    if (!creds.email || !creds.password) return res.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.findUser({ email: creds.email, password: sha1(creds.password) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    const token = uuid.v4();
    const key = `auth_${token}`;
    // 86400 seconds = 24 hours
    await redisClient.set(key, user._id.toString(), 86400);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: 'Unauthorized' });
    await redisClient.del(`auth_${token}`);
    return res.status(204).end();
  }
}

module.exports = AuthController;
