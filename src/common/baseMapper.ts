import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { Collection, Document, Filter } from "mongodb";
import { createQueryFilter } from "./query-filter";
import DuplicationException from "./DuplicationException";
import ValidationException from "./ValidationException";
import { generateUuid } from "./uuid";

export interface MapperSchema {
  name: string;
  collectionName: string;
  type: string;
  properties: Record<string, unknown>;
  additionalProperties?: boolean;
  required?: string[];
  searchable?: string[];
  unique?: string[];
}

export interface MapperRecord {
  _id?: string;
  id?: string;
  [key: string]: unknown;
}

const ajv = new Ajv({ removeAdditional: true, allErrors: true, strict: false });
addFormats(ajv);

function createMapperQueryFilter(schema: MapperSchema): {
  parse: (params: unknown) => Record<string, unknown>;
} {
  const searchable = schema.searchable ?? Object.keys(schema.properties);
  const whitelist: Record<string, number> = { after: 1, before: 1, between: 1 };
  searchable.forEach((key) => {
    whitelist[key] = 1;
  });
  return createQueryFilter({
    whitelist,
    custom: {
      between: "updatedAt",
      after: "updatedAt",
      before: "updatedAt",
    },
  });
}

export interface BaseMapperOptions {
  collectionName?: string;
  detailRoute?: string;
  listRoute?: string;
}

export default class BaseMapper {
  collection: Collection;

  queryFilter: { parse: (params: unknown) => Record<string, unknown> };

  pageSize: number;

  collectionName: string;

  protected schema: MapperSchema;

  static generateUuid(): string {
    return generateUuid();
  }

  constructor(
    db: unknown,
    schema: MapperSchema,
    options: BaseMapperOptions = {},
  ) {
    this.schema = schema;
    this.collectionName = options.collectionName ?? schema.collectionName;
    this.collection = (
      db as { collection: (name: string) => Collection }
    ).collection(this.collectionName);
    this.pageSize = 25;
    this.queryFilter = createMapperQueryFilter(schema);

    if (!Object.prototype.hasOwnProperty.call(schema, "unique")) {
      this.schema.unique = [];
    }
  }

  protected setDates(data: Record<string, unknown>, key: string): void {
    const dateOps = ["$gt", "$gte", "$lt", "$lte", "$ne", "$eq", "$in", "$nin"];
    for (const x of Object.keys(data)) {
      const val = data[x];
      if (
        val !== null &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        !(val instanceof Date)
      ) {
        this.setDates(val as Record<string, unknown>, key);
      } else if (
        (key === x || dateOps.includes(x)) &&
        typeof val === "string" &&
        !Number.isNaN(Date.parse(val))
      ) {
        (data as Record<string, unknown>)[x] = new Date(val);
      }
    }
  }

  protected checkDates(
    schemaProperties: Record<string, unknown>,
    data: Record<string, unknown>,
  ): void {
    for (const k of Object.keys(schemaProperties)) {
      const prop = schemaProperties[k] as Record<string, unknown>;
      if (
        prop &&
        typeof prop === "object" &&
        prop.items &&
        (prop.items as Record<string, unknown>).properties
      ) {
        this.checkDates(
          (prop.items as Record<string, unknown>).properties as Record<
            string,
            unknown
          >,
          data,
        );
      } else if (prop?.instanceOf === "Date") {
        this.setDates(data, k);
      }
    }
  }

  toDatabase(entity: Record<string, unknown>): Record<string, unknown> {
    const data = { ...entity };
    if (Object.prototype.hasOwnProperty.call(data, "id")) {
      data._id = data.id;
      delete data.id;
    }
    this.checkDates(this.schema.properties, data);
    return data;
  }

  validate(
    data: Record<string, unknown>,
    validateAll = false,
  ): Record<string, unknown> {
    const schema = { ...this.schema };
    if (validateAll === false) {
      (schema as Record<string, unknown>).required = undefined;
    }
    const props = {
      ...schema.properties,
      deleted: { type: "boolean", default: false },
      deletedAt: { type: "string", format: "date-time" },
      deletedBy: { type: ["string", "null"] },
    };
    const schemaToUse = { ...schema, properties: props };
    const valid = ajv.validate(schemaToUse as object, data);
    if (!valid) {
      throw new ValidationException(ajv.errors ?? []);
    }
    return data;
  }

  validateAll(data: Record<string, unknown>): Record<string, unknown> {
    return this.validate(data, true);
  }

  async checkUniqueness(
    data: Record<string, unknown>,
    id: string | null = null,
  ): Promise<void> {
    const unique = this.schema.unique ?? [];
    if (unique.length === 0) return;

    const orFilter: Record<string, unknown>[] = [];
    unique.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(data, key)) return;
      const val = data[key];
      if (Array.isArray(val)) {
        for (const v of val) {
          orFilter.push({ [key]: v });
        }
      } else {
        orFilter.push({ [key]: val });
      }
    });
    if (orFilter.length === 0) return;

    const filter: Filter<Document> = {
      $or: orFilter,
      deleted: { $ne: true },
    } as Filter<Document>;
    if (id != null) {
      (filter as Record<string, unknown>)._id = { $ne: id };
    }
    const list = await this.collection.find(filter).toArray();
    if (list.length === 0) return;

    const message: string[] = [];
    for (const json of list) {
      for (const key of unique) {
        if (
          Object.prototype.hasOwnProperty.call(data, key) &&
          Object.prototype.hasOwnProperty.call(json, key)
        ) {
          const dataVal = data[key];
          const jsonVal = (json as Record<string, unknown>)[key];
          if (Array.isArray(dataVal) && Array.isArray(jsonVal)) {
            for (const dv of dataVal) {
              for (const jv of jsonVal) {
                if (jv === dv) message.push(key);
              }
            }
          } else if (dataVal === jsonVal) {
            message.push(key);
          }
        }
      }
    }
    throw new DuplicationException([...new Set(message)]);
  }

  toJson(data: Record<string, unknown>): Record<string, unknown> {
    const json: Record<string, unknown> = { id: data._id, ...data };
    delete json._id;
    if (json.deleted === false) {
      delete json.deleted;
      delete json.deletedAt;
      delete json.deletedBy;
    }
    return json;
  }

  async detail(id: string, withDeleted = false): Promise<unknown> {
    const filter = { _id: id } as unknown as Filter<Document>;
    if (!withDeleted) {
      (filter as Record<string, unknown>).deleted = { $ne: true };
    }
    return this.collection.findOne(filter);
  }

  async list(
    paramsOrig: Record<string, unknown>,
    _aggregateParam?: unknown,
  ): Promise<unknown> {
    const params = JSON.parse(JSON.stringify(paramsOrig)) as Record<
      string,
      unknown
    >;
    const withDeleted = params.deleted ?? params.disabled ?? false;
    const withCount = params._count ?? false;
    const pageSize = parseInt(
      String(params._pageSize ?? params.pageSize ?? this.pageSize),
      10,
    );
    const sortBy = (params.sort as string) ?? "createdAt";
    const orderBy = parseInt(String(params.order ?? -1), 10);
    const sort: Record<string, 1 | -1> = { [sortBy]: orderBy as 1 | -1 };
    const query = this.queryFilter.parse(params) as Record<string, unknown>;

    if (withDeleted === "1" || withDeleted === "true") {
      delete query.deleted;
    } else {
      query.deleted = { $ne: true };
    }
    this.checkDates(this.schema.properties, query);

    const fields = String(params.fields ?? "").split(",");
    const project: Record<string, number> = {};
    fields.forEach((field) => {
      if (field.length > 0) project[field] = 1;
    });

    const page = parseInt(String(params.page ?? 1), 10);
    const skip = (page - 1) * pageSize;

    const list = await this.collection
      .find(query as Filter<Document>)
      .project(project)
      .sort(sort)
      .limit(pageSize)
      .skip(skip)
      .toArray();

    const result: {
      result: unknown[];
      page: number;
      count?: number;
      page_count?: number;
    } = {
      result: list,
      page,
    };
    if (withCount === "1" || withCount === "true" || withCount === true) {
      const count = await this.collection.countDocuments(
        query as Filter<Document>,
      );
      result.count = count;
      result.page_count = Math.ceil(count / pageSize);
    }
    return this.sanitize(result, "result");
  }

  async update(
    id: string,
    post: Record<string, unknown>,
    withDeleted = false,
  ): Promise<unknown> {
    const filter = { _id: id } as unknown as Filter<Document>;
    if (!withDeleted) {
      (filter as Record<string, unknown>).deleted = { $ne: true };
    }

    const validated = this.validate(post) as Record<string, unknown>;
    const data = this.toDatabase(validated);

    await this.checkUniqueness(data, id);

    data.updatedAt = new Date();

    let update: Record<string, unknown>;
    if (data.deleted !== true) {
      delete data.deleted;
      delete data.deletedAt;
      delete data.deletedBy;
      update = {
        $set: data,
        $unset: { deleted: "", deletedAt: "", deletedBy: "" },
      };
    } else {
      data.deleted = true;
      data.deletedAt = new Date();
      update = { $set: data };
    }

    const result = await this.collection.findOneAndUpdate(
      filter,
      update as Record<string, unknown>,
      { returnDocument: "after", upsert: false },
    );
    return this.sanitize(result);
  }

  async delete(id: string, _userId: string | null = null): Promise<unknown> {
    const data = {
      deleted: true,
      deletedAt: new Date(),
    };
    const result = await this.collection.findOneAndUpdate(
      { _id: id, deleted: { $ne: true } } as unknown as Filter<Document>,
      { $set: data },
      { returnDocument: "after", upsert: false },
    );
    return this.sanitize(result);
  }

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
    const one = await this.collection.findOne(
      params as Filter<Document>,
      options,
    );
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
    return this.collection.countDocuments(query as Filter<Document>);
  }

  async create(post: Record<string, unknown>): Promise<unknown> {
    const validated = this.validateAll(post) as Record<string, unknown>;
    const data = this.toDatabase(validated) as Record<string, unknown>;

    await this.checkUniqueness(data);

    if (!Object.prototype.hasOwnProperty.call(data, "_id")) {
      data._id = (this.constructor as typeof BaseMapper).generateUuid();
    }
    data.createdAt = new Date();
    data.updatedAt = data.createdAt;
    await this.collection.insertOne(data as Document);

    return this.sanitize(data);
  }
}
