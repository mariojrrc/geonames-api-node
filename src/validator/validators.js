const validator = require("validator").default;

const validateUUID = (uuid = "") => {
  return validator.isUUID(uuid, 4);
};

const validateUrl = (url = "") => /(http(s?)):\/\//i.test(url);

module.exports = {
  validateUUID,
  validateUrl,
};
