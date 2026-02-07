import path from "path";

const logPath = path.join(__dirname, "../../logs/test.log");

export default {
  hostName: process.env.HOST_NAME,
  web: {
    port: 3001,
  },
  db: {
    dbName: "geonames_test",
    uri: process.env.DATABASE_URL || "mongodb://localhost:27017",
    options: {
      socketTimeoutMS: 5000,
    },
  },
  logging: {
    appenders: {
      console: { type: "console" },
      file: { type: "file", filename: logPath },
    },
    categories: {
      default: { appenders: ["console"], level: "debug" },
    },
  },
  auth: [
    {
      identity: "82b1eafd-09ab-41a9-badb-0e20c9facb4f",
      credential: "04696d2e-9421-4443-a927-21275c86026b",
    },
  ],
};
