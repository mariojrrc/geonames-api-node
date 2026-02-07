import type { Logger } from "log4js";
import type { AppConfig } from "./config";

declare global {
  var appConfig: AppConfig;
  var logger: Logger;
}

export {};
