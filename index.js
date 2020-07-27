"uses strict";

// (*)IPC: Tem que ficar aqui para todos os modulos lerem a configuração
global.appConfig = require("./config/index");
const Koa = require("koa");
const KoaBody = require("koa-body");
const helmet = require("koa-helmet");
const cors = require("koa2-cors");
const userAgent = require("koa2-useragent");
const ErrorMiddleware = require("./src/middleware/error");
const DebugMiddleware = require("./src/middleware/debug");

const { NewRelicMiddleware } = require("koa-mongo-crud");
const koaSwagger = require("koa2-swagger-ui");
const serve = require("koa-static");
const { createContainer, asValue } = require("awilix");
const { scopePerRequest, loadControllers } = require("awilix-koa");
const loadGeonamesModuleContainer = require("./src/container");
const config = require("./config");

const app = new Koa();

const container = createContainer();
loadGeonamesModuleContainer(container, config);

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
      url: `${config.hostName}/swagger.yaml`,
    },
  })
);

app.use(
  KoaBody({
    multipart: false,
    formLimit: "56kb",
    jsonLimit: "256kb",
    textLimit: "56kb",
    parsedMethods: ["POST", "PUT", "PATCH", "DELETE"],
  })
);

/* Middlewares */
if (process.env.NODE_ENV === "production") {
  app.use(NewRelicMiddleware);
}
app.use(helmet());
app.use(ErrorMiddleware);
app.use(cors());
app.use(userAgent());
app.use(DebugMiddleware);

app.use(loadControllers("./src/**/*.route.js", { cwd: __dirname }));

const server = app.listen(config.web.port || 8080, () => {
  const host = server.address().address;
  // eslint-disable-next-line prefer-destructuring
  const port = server.address().port;

  // eslint-disable-next-line no-console
  console.log(
    "App %s %s listening at http://%s:%s",
    config.name,
    config.version,
    host,
    port
  );
});

module.exports = server;
