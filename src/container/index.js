const { asFunction, asValue, Lifetime } = require("awilix");
const Log4js = require("log4js");
const mongoConnection = require("../../infra/mongo");

module.exports = async function loadGeonamesModuleContainer(container, config) {
  container.register(
    "logger",
    asFunction(() => {
      Log4js.configure(config.logging);
      return Log4js.getLogger();
    })
  );

  container.register(
    "mongoConnection",
    asValue(await mongoConnection(container.resolve("logger"), config.db))
  );
  container.register("mapperOptions", asValue({}));

  container.register(
    "db",
    asFunction((cradle) =>
      cradle.mongoConnection.db(config.db.dbName)
    ).singleton()
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
      formatName: (name) => {
        const splat = name.split(".");
        const namespace = splat[1];
        const resource = splat[0].split("-");
        let resourceName = resource.shift();

        resourceName += resource.reduce((total, part) => {
          return total + part.replace(/^./, part[0].toUpperCase());
        }, "");

        return resourceName + namespace.replace(/\w/, (a) => a.toUpperCase());
      },
    }
  );

  return container;
};
