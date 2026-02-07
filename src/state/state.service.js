/* eslint-disable func-names, no-param-reassign */
/* eslint import/no-unresolved: [2, { caseSensitive: false }] */
const { ValidationException } = require("koa-mongo-crud");
const ApiError = require("../common/api-error");
const GeonamesBaseservice = require("../common/baseService");
const { validateStateSchema } = require("../validator");

class StateService extends GeonamesBaseservice {
  constructor(opts) {
    super(opts);
    this.repository = opts.stateMapper;
  }

  async cancel(id) {
    try {
      const state = await this.repository.delete(id);
      if (!state) {
        throw new ApiError("Not Found", 404);
      }
      return this.sanitizedResponse(204, {});
    } catch (error) {
      return this.responseError(error);
    }
  }

  async create(data) {
    try {
      const isValid = validateStateSchema(data);
      if (isValid instanceof ValidationException) throw isValid;
      return this.sanitizedResponse(201, await this.repository.create(data));
    } catch (error) {
      return this.responseError(error);
    }
  }

  async list(query = {}) {
    const states = await this.repository.list(query);
    const embeddedStates = this.repository.toHalCollection(states);
    return this.sanitizedResponse(200, embeddedStates);
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
      const isValid = validateStateSchema(data);
      if (isValid instanceof ValidationException) throw isValid;

      const state = await this.repository.findById(id);
      if (state == null) {
        throw new ApiError("Not Found", 404);
      }
      const response = await this.update(id, data);
      return this.sanitizedResponse(200, response);
    } catch (error) {
      return this.responseError(error);
    }
  }

  async update(id, data) {
    return this.repository.update(id, data);
  }

  async bulk(ids) {
    const states = await this.repository.bulk(ids);
    return this.sanitizedResponse(200, states);
  }
}

module.exports = StateService;
