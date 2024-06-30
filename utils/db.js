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

  async createFile(file) {
    const newFile = await this.db.collection('files').insertOne(file);
    return newFile.ops[0];
  }

  async findFileById(id) {
    return this.db.collection('files').findOne({ _id: new mongo.ObjectID(id) });
  }

  async findFile(file) {
    return this.db.collection('files').findOne(file);
  }

  async findFiles(file) {
    const page = file.page || 0;
    const parentId = file.parentId || 0;
    const { userId } = file;
    const query = { parentId, userId };
    const cursor = await this.db.collection('files').find(query).skip(page * 20).limit(20);
    return cursor.toArray();
  }

  async updateFileById(id, updatedFile) {
    await this.db.collection('files').updateOne({ _id: new mongo.ObjectID(id) }, { $set: updatedFile });
    return this.findFileById(id);
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
