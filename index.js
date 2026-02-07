"uses strict";

// (*)IPC: Tem que ficar aqui para todos os modulos lerem a configuração
global.appConfig = require("./config/index");
const Koa = require("koa");
const { koaBody } = require("koa-body");
const helmet = require("koa-helmet");
const cors = require("koa2-cors");
const userAgent = require("koa2-useragent");
const ErrorMiddleware = require("./src/middleware/error");
const DebugMiddleware = require("./src/middleware/debug");

const { NewRelicMiddleware } = require("koa-mongo-crud");
const { koaSwagger } = require("koa2-swagger-ui");
const serve = require("koa-static");
const { createContainer, asValue } = require("awilix");
const { scopePerRequest, loadControllers } = require("awilix-koa");
const loadGeonamesModuleContainer = require("./src/container");
const config = require("./config");

const app = new Koa();

async function start() {
  const container = createContainer();
  await loadGeonamesModuleContainer(container, config);

  app.use(scopePerRequest(container));
  app.use((ctx, next) => {
    ctx.state.container.register({
      context: asValue(ctx),
    });
    return next();
  });

  app.use(serve("./docs"));
  app.use(
    koaSwagger({
      routePrefix: "/docs",
      swaggerOptions: {
        url: `swagger.yml`,
      },
    })
  );

  app.use(
    koaBody({
      multipart: false,
      formLimit: "56kb",
      jsonLimit: "256kb",
      textLimit: "56kb",
      parsedMethods: ["POST", "PUT", "PATCH", "DELETE"],
    })
  );

  if (process.env.NODE_ENV === "production") {
    app.use(NewRelicMiddleware);
  }
  app.use(helmet());
  app.use(ErrorMiddleware);
  app.use(cors());
  app.use(userAgent());
  app.use(DebugMiddleware);

  app.use(loadControllers("./src/**/*.route.js", { cwd: __dirname }));

  return new Promise((resolve) => {
    const server = app.listen(config.web.port || 3000, () => {
      const host = server.address().address;
      const port = server.address().port;
      // eslint-disable-next-line no-console
      console.log(
        "App %s %s listening at http://%s:%s",
        config.name,
        config.version,
        host,
        port
      );
      resolve(server);
    });
  });
}

const serverPromise = start();
module.exports = serverPromise;
