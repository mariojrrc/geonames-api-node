const moment = require("moment");

module.exports.validateEmail = (email) => {
  // eslint-disable-next-line
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

module.exports.getDateFormat = (ctx, date) => {
  if (
    date &&
    /(0[1-9]|[12]\d|3[01])\/(0[1-9]|[12]\d|3[01])\/([12]\d{3})/.test(date)
  ) {
    return moment.utc(date, ctx.t("GLOBAL.DATE_FORMAT")).toISOString();
  }
  return date;
};

module.exports.asyncHandler = (fn) => {
  return new Promise((resolve, reject) => {
    fn.then((result) => {
      resolve([null, result]);
    }).catch((err) => {
      reject(err);
    });
  });
};
module.exports.arrayValues = (a) => {
  const array = [];

  /* eslint no-restricted-syntax: "off" */
  for (const key in a) {
    if (Object.prototype.hasOwnProperty.call(a, key)) {
      array.push(a[key]);
    }
  }

  return array;
};

module.exports.utcDateTime = (date) =>
  `${moment(date).format("YYYY-MM-DD hh:mm:ss")}.000`;

module.exports.isEmpty = (obj) => Object.keys(obj).length === 0;
