const MongoConnection = require('../infra/mongo');
const config = require('../config');

const AuthorizationHeader = () => 'Basic ODJiMWVhZmQtMDlhYi00MWE5LWJhZGItMGUyMGM5ZmFjYjRmOjA0Njk2ZDJlLTk0MjEtNDQ0My1hOTI3LTIxMjc1Yzg2MDI2Yg==';
async function dropCollection (collectionName) {
  if (process.env.NODE_ENV === 'test') {
    const conn = await MongoConnection(null, config);
    const db = conn.db(config.db.dbName);
    await db.collection(collectionName).drop();
  }
}

async function populateCollection(collectionName, objects) {
  const conn = await MongoConnection(null, config);
  const db = conn.db(config.db.dbName);
  await db.collection(collectionName).insertMany(objects);
}

module.exports = {
  AuthorizationHeader,
  dropCollection,
  populateCollection
};
