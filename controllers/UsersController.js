const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(request, response) {
    const { email } = request.body;
    const password = sha1(request.body.password);
    if (!email) return response.status(400).send({ error: 'Missing email' });
    if (!password) return response.status(400).send({ error: 'Missing password' });
    try {
      const userExist = await dbClient.db.collection('users').findOne({ email });
      if (userExist) {
        return response.status(400).send({ error: 'Already exist' });
      }
      const user = await dbClient.db.collection('users').insertOne({ email, password });
      return response.status(201).send({ id: user.insertedId, email });
    } catch (error) {
      return response.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
