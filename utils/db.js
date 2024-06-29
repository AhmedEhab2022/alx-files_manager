const mongo = require('mongodb');
const { promisify } = require('util');

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

    this.nbUsers = promisify(this.db.collection('users').countDocuments).bind(this.db.collection('users'));
    this.nbFiles = promisify(this.db.collection('files').countDocuments).bind(this.db.collection('files'));
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    return this.nbUsers();
  }

  async nbFiles() {
    return this.nbFiles();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
