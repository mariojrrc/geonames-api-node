// Vercel api directory: re-export the Koa handler from dist
// Requires buildCommand to run first (creates dist/)
module.exports = require("../dist/index.js");
