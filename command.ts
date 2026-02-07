import { program } from "commander";
import has from "lodash.has";
import Log4js from "log4js";
import config from "./config";
import mongoConnection from "./infra/mongo";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("./package.json") as { version: string };

if (has(config, "logging")) {
  Log4js.configure(config.logging as import("log4js").Configuration);
  global.logger = Log4js.getLogger();
}

function increaseVerbosity(_v: string, total: number): number {
  return total + 1;
}

program
  .version(version)
  .option(
    "-v, --verbose",
    "A value that can be increased",
    increaseVerbosity,
    0,
  )
  .option("-l, --log", "Log to a file")
  .description("GeoName Commands");

program
  .command("populate:db")
  .description("Populate DB with Brazilian States and Cities")
  .option("--drop", "Drop collections before inserting")
  .action(async function populateDB(options: { drop?: boolean }) {
    global.logger.info("Starting");

    const conn = await mongoConnection(global.logger, config.db);
    const db = conn.db(config.db.dbName) as import("mongodb").Db;

    if (options.drop) {
      global.logger.info("dropping");
      await Promise.all([
        db.collection("states").deleteMany({}),
        db.collection("cities").deleteMany({}),
      ]);
    }

    global.logger.info("Inserting states and cities");
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      db
        .collection("states")
        .insertMany(require("./infra/db-seed/states.json")),
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      db
        .collection("cities")
        .insertMany(require("./infra/db-seed/cities.json")),
    ]);

    global.logger.info("Creating indexes");
    await db
      .collection("states")
      .createIndex({ "$**": "text", name: 1, shortName: 1 });
    await db.collection("states").createIndex({ shortName: 1 });
    await db.collection("cities").createIndex({ name: 1 });
    await db.collection("cities").createIndex({ "$**": "text", name: 1 });

    global.logger.info("Done.");
  });

program.parse(process.argv);
