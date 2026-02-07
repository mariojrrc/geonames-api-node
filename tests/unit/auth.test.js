const path = require("path");
const authPath = path.join(__dirname, "../../dist/src/middleware/auth.js");
const { authMiddleware } = require(authPath);

describe("auth middleware", () => {
  const config = [
    { identity: "user1", credential: "secret1" },
    { identity: "user2", credential: "secret2" },
  ];

  function createMockCtx(overrides = {}) {
    const ctx = {
      request: {
        path: "/v1/city",
        headers: {},
        ...overrides.request,
      },
      throw(status, message) {
        const err = new Error(message);
        err.status = status;
        throw err;
      },
      ...overrides,
    };
    return ctx;
  }

  it("calls next() when config is empty", async () => {
    const middleware = authMiddleware([]);
    const ctx = createMockCtx();
    const next = jest.fn().mockResolvedValue(undefined);
    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("calls next() when path is in allowedRoutes", async () => {
    const middleware = authMiddleware(config, ["/v1/health", "/v1/city"]);
    const ctx = createMockCtx();
    const next = jest.fn().mockResolvedValue(undefined);
    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("throws 401 when Authorization header is missing", async () => {
    const middleware = authMiddleware(config, []);
    const ctx = createMockCtx({ request: { path: "/v1/city", headers: {} } });
    const next = jest.fn();
    await expect(middleware(ctx, next)).rejects.toMatchObject({
      message: "Authorization failed",
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("throws 401 when Authorization is not Basic", async () => {
    const middleware = authMiddleware(config, []);
    const ctx = createMockCtx({
      request: {
        path: "/v1/city",
        headers: { authorization: "Bearer token" },
      },
    });
    const next = jest.fn();
    await expect(middleware(ctx, next)).rejects.toMatchObject({
      message: "Authorization failed",
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("throws 401 when Basic credentials are invalid", async () => {
    const middleware = authMiddleware(config, []);
    const badCreds = Buffer.from("user1:wrongpassword", "utf8").toString("base64");
    const ctx = createMockCtx({
      request: {
        path: "/v1/city",
        headers: { authorization: `Basic ${badCreds}` },
      },
    });
    const next = jest.fn();
    await expect(middleware(ctx, next)).rejects.toMatchObject({
      message: "Authorization failed",
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when Basic credentials match config", async () => {
    const middleware = authMiddleware(config, []);
    const creds = Buffer.from("user1:secret1", "utf8").toString("base64");
    const ctx = createMockCtx({
      request: {
        path: "/v1/city",
        headers: { authorization: `Basic ${creds}` },
      },
    });
    const next = jest.fn().mockResolvedValue(undefined);
    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("accepts any configured identity/credential pair", async () => {
    const middleware = authMiddleware(config, []);
    const creds = Buffer.from("user2:secret2", "utf8").toString("base64");
    const ctx = createMockCtx({
      request: {
        path: "/v1/state",
        headers: { authorization: `Basic ${creds}` },
      },
    });
    const next = jest.fn().mockResolvedValue(undefined);
    await middleware(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("throws 401 when Base64 is malformed", async () => {
    const middleware = authMiddleware(config, []);
    const ctx = createMockCtx({
      request: {
        path: "/v1/city",
        headers: { authorization: "Basic !!!invalid-base64!!!" },
      },
    });
    const next = jest.fn();
    await expect(middleware(ctx, next)).rejects.toMatchObject({
      status: 401,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
