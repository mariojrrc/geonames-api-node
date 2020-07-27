require("dotenv").config();
const path = require("path");
const { version } = require("../package.json");

const ENV = process.env.NODE_ENV || "development";

const envConfig = require(path.join(__dirname, "environments", ENV));

const config = {
  [ENV]: true,
  env: ENV,
  name: "geonames-api-node",
  secretKey: process.env.SECRET_KEY || "change",
  version,
  auth: [
    {
      identity: "401557cf-cd59-410e-9d55-8ba796955f5c",
      credential: "b7ffeb5ff0a14453fe725f8277532897e4437a14",
    },
  ],
  ...envConfig,
};

module.exports = config;
