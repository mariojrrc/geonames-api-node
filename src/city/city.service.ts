import type { Context } from "koa";
import { ValidationException } from "koa-mongo-crud";
import { ApiError } from "../common/api-error";
import GeonamesBaseService from "../common/baseService";
import { validateCitySchema } from "../validator";
import type CityMapper from "./city.mapper";

interface CityServiceOpts {
  context: Context;
  logger?: { info: (msg: string) => void; error: (err: unknown) => void };
  cityMapper: InstanceType<typeof CityMapper>;
}

export default class CityService extends GeonamesBaseService {
  repository: InstanceType<typeof CityMapper>;

  constructor(opts: CityServiceOpts) {
    super(opts);
    this.repository = opts.cityMapper;
  }

  async cancel(id: string): Promise<{ body: unknown; statusCode: number }> {
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

  async create(
    data: Record<string, unknown>,
  ): Promise<{ body: unknown; statusCode: number }> {
    try {
      const isValid = validateCitySchema(data);
      if (isValid instanceof ValidationException) throw isValid;
      return this.sanitizedResponse(201, await this.repository.create(data));
    } catch (error) {
      return this.responseError(error);
    }
  }

  async list(
    query: Record<string, unknown> = {},
  ): Promise<{ body: unknown; statusCode: number }> {
    const citys = await this.repository.list(query);
    const embedded = this.repository.toHalCollection(
      citys as { result: unknown[]; page: number },
    );
    return this.sanitizedResponse(200, embedded);
  }

  async get(
    id: string,
    withDeleted = false,
  ): Promise<{ body: unknown; statusCode: number }> {
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

  async updateOne(
    id: string,
    data: Record<string, unknown>,
  ): Promise<{ body: unknown; statusCode: number }> {
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

  async update(id: string, data: Record<string, unknown>): Promise<unknown> {
    return this.repository.update(id, data);
  }
}
