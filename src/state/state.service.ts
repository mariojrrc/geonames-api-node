import type { Context } from "koa";
import ValidationException from "../common/ValidationException";
import { ApiError } from "../common/api-error";
import GeonamesBaseService from "../common/baseService";
import { validateStateSchema } from "../validator";
import type StateMapper from "./state.mapper";

interface StateServiceOpts {
  context: Context;
  logger?: { info: (msg: string) => void; error: (err: unknown) => void };
  stateMapper: InstanceType<typeof StateMapper>;
}

export default class StateService extends GeonamesBaseService {
  repository: InstanceType<typeof StateMapper>;

  constructor(opts: StateServiceOpts) {
    super(opts);
    this.repository = opts.stateMapper;
  }

  async cancel(id: string): Promise<{ body: unknown; statusCode: number }> {
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

  async create(
    data: Record<string, unknown>,
  ): Promise<{ body: unknown; statusCode: number }> {
    try {
      const isValid = validateStateSchema(data);
      if (isValid instanceof ValidationException) throw isValid;
      return this.sanitizedResponse(201, await this.repository.create(data));
    } catch (error) {
      return this.responseError(error);
    }
  }

  async list(
    query: Record<string, unknown> = {},
  ): Promise<{ body: unknown; statusCode: number }> {
    const states = await this.repository.list(query);
    const embedded = this.repository.toHalCollection(
      states as { result: unknown[]; page: number },
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

  async update(id: string, data: Record<string, unknown>): Promise<unknown> {
    return this.repository.update(id, data);
  }

  async bulk(ids: string[]): Promise<{ body: unknown; statusCode: number }> {
    const states = await this.repository.bulk(ids);
    return this.sanitizedResponse(200, states);
  }
}
