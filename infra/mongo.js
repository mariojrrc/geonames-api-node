const { MongoClient } = require("mongodb");

let client;
module.exports = async (logger, dbconfig) => {
  if (!client) {
    try {
      client = new MongoClient(dbconfig.uri, dbconfig.options);
      await client.connect();
      if (logger) logger.info("Database connection established");
    } catch (err) {
      if (logger) logger.error(err);
      throw err;
    }
  }
  return client;
};
