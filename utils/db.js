const mongo = require('mongodb');

class DBClient {
  constructor() {
    this.db = null;
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    this.client = new mongo.MongoClient(url, { useUnifiedTopology: true });
    this.client.connect((err) => {
      if (err) console.log(err);
      else this.db = this.client.db(database);
    });
  }

  isAlive() {
    // !! convert to boolean
    return !!this.db;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }

  async findUserByEmail(email) {
    return this.db.collection('users').findOne({ email });
  }

  async findUserById(id) {
    return this.db.collection('users').findOne({ _id: new mongo.ObjectID(id) });
  }

  async findUser(user) {
    return this.db.collection('users').findOne(user);
  }

  async createUser(email, password) {
    const user = await this.db.collection('users').insertOne({ email, password });
    return { id: user.insertedId, email };
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
