const responseBuilder = {};

responseBuilder.createResponse = (ctx, body, status = 200) => {
  ctx.body = body;
  ctx.status = status;
};

module.exports = responseBuilder;
