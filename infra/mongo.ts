import { MongoClient, MongoClientOptions } from "mongodb";
import type { DbConfig } from "../types/config";

let client: MongoClient | null = null;

export async function connect(
  logger: { info: (msg: string) => void; error: (err: unknown) => void } | null,
  dbconfig: DbConfig,
): Promise<MongoClient> {
  if (!client) {
    try {
      client = new MongoClient(
        dbconfig.uri,
        dbconfig.options as MongoClientOptions,
      );
      await client.connect();
      if (logger) logger.info("Database connection established");
    } catch (err) {
      if (logger) logger.error(err);
      throw err;
    }
  }
  return client;
}

export function close(): Promise<void> {
  if (client) {
    const p = client.close();
    client = null;
    return p;
  }
  return Promise.resolve();
}

const mongoConnection: typeof connect & { close: typeof close } = Object.assign(
  connect,
  { close },
);
export default mongoConnection;
