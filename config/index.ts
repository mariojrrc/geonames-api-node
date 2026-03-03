import "dotenv/config";
import path from "path";
import type { AppConfig } from "../types/config";

// From source: __dirname is config/; from dist: __dirname is dist/config/
const projectRoot =
  path.basename(path.dirname(__dirname)) === "dist"
    ? path.join(__dirname, "..", "..")
    : path.join(__dirname, "..");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require(path.join(projectRoot, "package.json")) as {
  version: string;
};

const ENV = process.env.NODE_ENV || "development";

// Static requires for Vercel/serverless bundlers that don't trace dynamic paths
let envConfig: Omit<
  AppConfig,
  "env" | "name" | "version" | "secretKey" | "auth"
>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
if (ENV === "production") {
  envConfig = require("./environments/production").default;
} else if (ENV === "staging") {
  envConfig = require("./environments/staging").default;
} else if (ENV === "test") {
  envConfig = require("./environments/test").default;
} else {
  envConfig = require("./environments/development").default;
}

const config: AppConfig = {
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
} as AppConfig;

export default config;
