const { MongoClient } = require("mongodb");

let db;
module.exports = async (logger, dbconfig) => {
  if (!db) {
    try {
      db = await MongoClient.connect(dbconfig.uri, dbconfig.options);
      logger.info("Database connection established");
    } catch (err) {
      logger.error(err);
    }
  }
  return db;
};
