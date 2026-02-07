export interface WebConfig {
  port?: number | string;
}

export interface DbConfig {
  dbName: string;
  uri: string;
  options?: { socketTimeoutMS?: number };
}

export interface LoggingConfig {
  appenders: Record<string, unknown>;
  categories: Record<string, unknown>;
}

export interface AuthEntry {
  identity: string;
  credential: string;
}

export interface AppConfig {
  env: string;
  name: string;
  version: string;
  secretKey: string;
  auth: AuthEntry[];
  hostName?: string;
  web: WebConfig;
  db: DbConfig;
  logging: LoggingConfig;
  [key: string]: unknown;
}

declare global {
  // eslint-disable-next-line no-var
  var appConfig: AppConfig;
}

export {};
