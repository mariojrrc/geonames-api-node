/* eslint-disable no-console */
import path from "path";
import type { Server } from "http";
import type Koa from "koa";
import type { AppConfig } from "./types/config";

// Load config first so all modules can read it
// eslint-disable-next-line @typescript-eslint/no-require-imports
global.appConfig = require("./config/index").default;

const KoaApp = require("koa") as typeof Koa;
const { koaBody } = require("koa-body");
const helmet = require("koa-helmet");
const cors = require("koa2-cors");
const userAgent = require("koa2-useragent");
const { newRelicMiddleware } = require("./src/middleware/newrelic");
const { koaSwagger } = require("koa2-swagger-ui");
const serve = require("koa-static");
const { createContainer, asValue } = require("awilix");
const { scopePerRequest, loadControllers } = require("awilix-koa");
const DebugMiddleware = require("./src/middleware/debug").default;
const ErrorMiddleware = require("./src/middleware/error").default;
const loadGeonamesModuleContainer = require("./src/container").default;
const config = (require("./config") as { default: AppConfig }).default;

const app = new KoaApp();

async function start(): Promise<Server> {
  const container = createContainer();
  await loadGeonamesModuleContainer(container, config);

  app.use(scopePerRequest(container));
  app.use((ctx, next) => {
    ctx.state.container?.register({
      context: asValue(ctx),
    });
    return next();
  });

  app.use(serve("./docs"));
  app.use(
    koaSwagger({
      routePrefix: "/docs",
      swaggerOptions: {
        url: "swagger.yml",
      },
    }),
  );

  app.use(
    koaBody({
      multipart: false,
      formLimit: "56kb",
      jsonLimit: "256kb",
      textLimit: "56kb",
      parsedMethods: ["POST", "PUT", "PATCH", "DELETE"],
    }),
  );

  if (process.env.NODE_ENV === "production") {
    app.use(newRelicMiddleware);
  }
  app.use(helmet());
  app.use(ErrorMiddleware);
  app.use(cors());
  app.use(userAgent());
  app.use(DebugMiddleware);

  // In dev (tsx) we run from project root and have .ts files; in prod we run from dist and have .js
  const isCompiled = path.basename(__dirname) === "dist";
  const routeGlob = isCompiled ? "./src/**/*.route.js" : "./src/**/*.route.ts";
  app.use(loadControllers(routeGlob, { cwd: __dirname }));

  if (process.env.NODE_ENV === "test") {
    return Promise.resolve(app as unknown as Server);
  }

  return new Promise((resolve) => {
    const port = Number(config.web?.port) || 3000;
    const host = config.web?.host ?? "0.0.0.0";
    const server = app.listen(port, host, () => {
      const address = server.address();
      const bindHost =
        address && typeof address === "object" ? address.address : host;
      const bindPort =
        address && typeof address === "object" ? address.port : port;
      console.log(
        "App %s %s listening at http://%s:%s",
        config.name,
        config.version,
        bindHost,
        bindPort,
      );
      resolve(server);
    });
  });
}

const serverPromise = start();
export = serverPromise;
