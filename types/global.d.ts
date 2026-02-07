import type { AppConfig } from "./config";

declare global {
  var appConfig: AppConfig;
  var logger: import("log4js").Logger;
}

export {};
