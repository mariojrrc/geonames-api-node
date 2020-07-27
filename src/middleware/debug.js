"uses strict";

module.exports = async (ctx, next) => {
  if (process.env.NODE_ENV === "development") {
    if (ctx.request.method !== "OPTIONS") {
      let msg = `Incoming request #${ctx.request.headers["x-request-id"] || 0}`;
      msg += `: method ${ctx.request.method}, url ${ctx.request.url}`;
      msg += `, body ${JSON.stringify(ctx.request.body)}`;
      console.log(msg);
    }

    await next();

    if (ctx.request.method !== "OPTIONS") {
      console.log(`, resp ${ctx.response.status}`);
    }
  } else {
    await next();
  }
};
