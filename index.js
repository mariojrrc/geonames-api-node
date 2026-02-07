/**
 * Entry: in test (with dist) or production use built JS; otherwise load TS via tsx.
 */
const path = require("path");
const fs = require("fs");
const useDist =
  process.env.NODE_ENV === "test" &&
  fs.existsSync(path.join(__dirname, "dist", "index.js"));

if (useDist) {
  module.exports = require("./dist/index.js");
} else {
  require("tsx/cjs");
  module.exports = require("./index.ts");
}
