const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const { ValidationException } = require("koa-mongo-crud");
const StateSchema = require("../state/state.model");
const CitySchema = require("../city/city.model");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateState = ajv.compile(StateSchema());
const validateCity = ajv.compile(CitySchema());

const validateStateSchema = (payload) => {
  const isValid = validateState(payload);
  if (!isValid) {
    return new ValidationException(validateState.errors);
  }
  return payload;
};

const validateCitySchema = (payload) => {
  const isValid = validateCity(payload);
  if (!isValid) {
    return new ValidationException(validateCity.errors);
  }
  return payload;
};

module.exports = {
  validateStateSchema,
  validateCitySchema,
};
