module.exports = async (ctx, next) => {
  await next();
  ctx.set("X-Api-Version", process.env.npm_package_version);
};
