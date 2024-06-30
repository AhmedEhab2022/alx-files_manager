const sha1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(request, response) {
    const { email } = request.body;
    let { password } = request.body;
    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password) return response.status(400).send({ error: 'Missing password' });
    try {
      const userExist = await dbClient.findUserByEmail(email);
      if (userExist) {
        return response.status(400).send({ error: 'Already exist' });
      }
      password = sha1(password);
      const user = await dbClient.createUser(email, password);
      return response.status(201).send({ id: user.insertedId, email });
    } catch (error) {
      return response.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    if (!token) return response.status(401).send({ error: 'Unauthorized' });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return response.status(401).send({ error: 'Unauthorized' });
    const user = await dbClient.findUserById(userId);
    if (!user) return response.status(401).send({ error: 'Unauthorized' });
    return response.status(200).send({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
