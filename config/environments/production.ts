import path from "path";

const logPath = path.join(__dirname, "../../logs/prod.log");

// On Vercel, filesystem is read-only except /tmp; use console-only to avoid streamroller errors
const isVercel = Boolean(process.env.VERCEL);

export default {
  hostName: process.env.HOST_NAME || "https://geonames-api-node.heroku.com",
  web: {
    port: process.env.PORT,
  },
  db: {
    dbName: "geonames",
    uri: process.env.DATABASE_URL,
    options: {
      socketTimeoutMS: 5000,
    },
  },
  logging: {
    appenders: {
      console: { type: "console", layout: { type: "basic" } },
      ...(!isVercel && {
        file: { type: "file", filename: logPath },
      }),
    },
    categories: {
      default: {
        appenders: isVercel ? ["console"] : ["console", "file"],
        level: "info",
      },
    },
  },
};
