class GeonamesBaseController {
  assert(ctx, assertStatusCode, response) {
    let allowedStatus = [assertStatusCode];
    if (Array.isArray(assertStatusCode)) {
      allowedStatus = allowedStatus.flat();
    }
    if (allowedStatus.indexOf(response.statusCode) === -1) {
      ctx.throw(response.statusCode, response.body.detail);
    }
  }
}

module.exports = GeonamesBaseController;
