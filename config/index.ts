import "dotenv/config";
import path from "path";
import type { AppConfig } from "../types/config";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require(
  path.join(__dirname, "..", "..", "package.json"),
) as {
  version: string;
};

const ENV = process.env.NODE_ENV || "development";

const envPath = path.join(__dirname, "environments", `${ENV}.js`);
// Use require for dynamic env module (compiled to .js in dist)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const envConfig = require(envPath).default as Omit<
  AppConfig,
  "env" | "name" | "version" | "secretKey" | "auth"
>;

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
