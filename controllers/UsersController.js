const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;
    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password) return response.status(400).send({ error: 'Missing password' });
    const userExist = await dbClient.db.collection('users').findOne({ email });
    if (userExist) {
      return response.status(400).send({ error: 'Already exist' });
    }
    const hashedPassword = sha1(password);
    const user = await dbClient.db.collection('users').insertOne({ email, hashedPassword });
    return response.status(201).send({ id: user.id, email: user.email });
  }
}

module.exports = UsersController;
