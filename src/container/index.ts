import path from "path";
import type { AwilixContainer } from "awilix";
import type { Configuration } from "log4js";
import { asFunction, asValue, Lifetime } from "awilix";
import Log4js from "log4js";
import mongoConnection from "../../infra/mongo";
import type { AppConfig } from "../../types/config";

const isCompiled = __dirname.includes(`${path.sep}dist${path.sep}`);
const ext = isCompiled ? "js" : "ts";

export default async function loadGeonamesModuleContainer(
  container: AwilixContainer,
  config: AppConfig,
): Promise<AwilixContainer> {
  container.register(
    "logger",
    asFunction(() => {
      Log4js.configure(config.logging as Configuration);
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
        `../**/*.model.${ext}`,
        {
          register: asValue,
          lifetime: Lifetime.SINGLETON,
        },
      ],
      `../**/!(base*)*.service.${ext}`,
      `../**/!(base*)*.mapper.${ext}`,
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
