const Status = require("http-status");

module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (typeof err.errors === "object") {
      err.status = 422;
    }
    ctx.status = err.status || 500;
    const detail =
      process.env.NODE_ENV === "production"
        ? err.message || err.errors
        : `${err.message || err.errors}\nStacktrace:\n${err.stack}`;
    ctx.body = {
      type: `https://httpstatuses.com/${ctx.status}`,
      title: Status[ctx.status],
      status: ctx.status,
      detail,
    };
  }
};
