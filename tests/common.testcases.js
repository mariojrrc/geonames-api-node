const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '..', 'dist');
const useDist =
  process.env.NODE_ENV === 'test' &&
  fs.existsSync(path.join(distPath, 'infra', 'mongo.js'));
const mongoModule = require(
  useDist ? path.join(distPath, 'infra', 'mongo') : '../infra/mongo'
);
const MongoConnection = mongoModule.default ?? mongoModule;
const configModule = require(useDist ? path.join(distPath, 'config') : '../config');
const config = configModule.default ?? configModule;

const AuthorizationHeader = () => 'Basic ODJiMWVhZmQtMDlhYi00MWE5LWJhZGItMGUyMGM5ZmFjYjRmOjA0Njk2ZDJlLTk0MjEtNDQ0My1hOTI3LTIxMjc1Yzg2MDI2Yg==';
async function dropCollection (collectionName) {
  if (process.env.NODE_ENV === 'test') {
    const conn = await MongoConnection(null, config.db);
    const db = conn.db(config.db.dbName);
    try {
      await db.collection(collectionName).drop();
    } catch (err) {
      if (err.code !== 26) throw err; // 26 = ns not found, ignore
    }
  }
}

async function populateCollection(collectionName, objects) {
  const conn = await MongoConnection(null, config.db);
  const db = conn.db(config.db.dbName);
  await db.collection(collectionName).insertMany(objects);
}

module.exports = {
  AuthorizationHeader,
  dropCollection,
  populateCollection
};
