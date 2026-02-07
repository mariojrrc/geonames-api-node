import { asFunction, asValue, Lifetime } from "awilix";
import Log4js from "log4js";
import mongoConnection from "../../infra/mongo";
import type { AppConfig } from "../../types/config";

export default async function loadGeonamesModuleContainer(
  container: import("awilix").AwilixContainer,
  config: AppConfig,
): Promise<import("awilix").AwilixContainer> {
  container.register(
    "logger",
    asFunction(() => {
      Log4js.configure(config.logging as import("log4js").Configuration);
      return Log4js.getLogger();
    }),
  );

  container.register(
    "mongoConnection",
    asValue(await mongoConnection(container.resolve("logger"), config.db)),
  );
  container.register("mapperOptions", asValue({}));

  container.register(
    "db",
    asFunction(
      (cradle: { mongoConnection: { db: (name: string) => unknown } }) =>
        cradle.mongoConnection.db(config.db.dbName),
    ).singleton(),
  );

  container.loadModules(
    [
      [
        "../**/*.model.js",
        {
          register: asValue,
          lifetime: Lifetime.SINGLETON,
        },
      ],
      "../**/!(base*)*.service.js",
      "../**/!(base*)*.mapper.js",
    ],
    {
      cwd: __dirname,
      formatName: (name: string) => {
        const splat = name.split(".");
        const namespace = splat[1];
        const resource = splat[0].split("-");
        let resourceName = resource.shift() ?? "";

        resourceName += resource.reduce(
          (total, part) => total + part.replace(/^./, (c) => c.toUpperCase()),
          "",
        );

        return resourceName + namespace.replace(/\w/, (a) => a.toUpperCase());
      },
    },
  );

  return container;
}
