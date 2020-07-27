/* eslint-disable func-names, no-param-reassign */
/* eslint import/no-unresolved: [2, { caseSensitive: false }] */
const { ValidationException } = require("koa-mongo-crud");
const ApiError = require("../common/api-error");
const GeonamesBaseservice = require("../common/baseService");
const { validateCitySchema } = require("../validator");

class CityService extends GeonamesBaseservice {
  constructor(opts) {
    super(opts);
    this.repository = opts.cityMapper;
  }

  async cancel(id) {
    try {
      const city = await this.repository.delete(id);
      if (!city) {
        throw new ApiError("Not Found", 404);
      }
      return this.sanitizedResponse(204, {});
    } catch (error) {
      return this.responseError(error);
    }
  }

  async create(data) {
    try {
      const isValid = validateCitySchema(data);
      if (isValid instanceof ValidationException) throw isValid;
      return this.sanitizedResponse(201, await this.repository.create(data));
    } catch (error) {
      return this.responseError(error);
    }
  }

  async list(query = {}) {
    const citys = await this.repository.list(query);
    const embeddedcitys = this.repository.toHalCollection(citys);
    return this.sanitizedResponse(200, embeddedcitys);
  }

  async get(id, withDeleted = false) {
    try {
      const response = await this.repository.findById(id, withDeleted);
      if (response == null) {
        throw new ApiError("Not Found", 404);
      }
      return this.sanitizedResponse(200, response);
    } catch (error) {
      return this.responseError(error);
    }
  }

  async updateOne(id, data) {
    try {
      const isValid = validateCitySchema(data);
      if (isValid instanceof ValidationException) throw isValid;

      const city = await this.repository.findById(id);
      if (city == null) {
        throw new ApiError("Not Found", 404);
      }
      const response = await this.update(id, data);
      return this.sanitizedResponse(200, response);
    } catch (error) {
      return this.responseError(error);
    }
  }

  async update(id, data) {
    const city = await this.repository.update(id, data);
    return this.repository.update(id, { ...city });
  }
}

module.exports = CityService;
