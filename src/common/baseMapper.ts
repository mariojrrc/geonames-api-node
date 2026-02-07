import { CrudMapper } from "koa-mongo-crud";
import type { Collection, Document, Filter } from "mongodb";

export interface MapperRecord {
  _id?: string;
  id?: string;
  [key: string]: unknown;
}

export default class BaseMapper extends CrudMapper {
  declare collection: Collection;

  declare queryFilter: { parse: (params: unknown) => unknown };

  declare pageSize: number;

  declare collectionName: string;

  async findById(id: string, withDeleted = false): Promise<unknown> {
    return this.detail(id, withDeleted);
  }

  async bulk(ids: string[]): Promise<unknown[]> {
    return this.collection
      .find({ _id: { $in: ids } } as unknown as Filter<Document>)
      .toArray();
  }

  async findOne(
    params: Filter<Record<string, unknown>>,
    options?: { [key: string]: unknown },
  ): Promise<unknown> {
    const one = await this.collection.findOne(params, options);
    return this.sanitize(one);
  }

  sanitize(data: unknown, key?: string): unknown {
    if (data == null) {
      return data;
    }

    let sanitized: unknown | unknown[];
    if (key != null) {
      sanitized = (data as Record<string, unknown>)[key];
    } else {
      sanitized = data;
    }

    if (Array.isArray(sanitized)) {
      sanitized = sanitized.map((r) => this.renameId(r as MapperRecord));
    } else {
      sanitized = this.renameId(sanitized as MapperRecord);
    }

    if (key != null) {
      (data as Record<string, unknown>)[key] = sanitized;
    } else {
      data = sanitized;
    }
    return data;
  }

  renameId(record: MapperRecord): Record<string, unknown> {
    const result = { id: record._id, ...record };
    delete result._id;
    return result;
  }

  async count(query: Filter<Record<string, unknown>>): Promise<number> {
    return this.collection.countDocuments(query);
  }

  async detail(id: string, withDeleted = false): Promise<unknown> {
    const one = await super.detail(id, withDeleted);
    return this.sanitize(one);
  }

  async list(
    paramsOrig: Record<string, unknown>,
    aggregateParam?: unknown,
  ): Promise<unknown> {
    const data = await super.list(paramsOrig, aggregateParam);
    return this.sanitize(data, "result");
  }

  async create(post: Record<string, unknown>): Promise<unknown> {
    const validated = this.validateAll(post) as Record<string, unknown>;
    const data = this.toDatabase(validated) as Record<string, unknown>;

    await this.checkUniqueness(data);

    if (!Object.prototype.hasOwnProperty.call(data, "_id")) {
      data._id = (
        this.constructor as unknown as { generateUuid(): string }
      ).generateUuid();
    }
    data.createdAt = new Date();
    data.updatedAt = data.createdAt;
    await this.collection.insertOne(data);

    return this.sanitize(data);
  }

  async update(
    id: string,
    post: Record<string, unknown>,
    withDeleted = false,
  ): Promise<unknown> {
    const updated = await super.update(id, post, withDeleted);
    return this.sanitize(updated);
  }

  async delete(id: string): Promise<unknown> {
    const deleted = await super.delete(id);
    return this.sanitize(deleted);
  }
}
