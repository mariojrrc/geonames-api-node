import hal from "hal";
import BaseMapper from "../common/baseMapper";
import type cityModel from "./city.model";

interface ListResult {
  result: unknown[];
  page: number;
  count?: number;
  page_count?: number;
}

interface CityMapperOpts {
  db: unknown;
  cityModel: typeof cityModel;
  mapperOptions: Record<string, unknown>;
}

export default class CityMapper extends BaseMapper {
  constructor({ db, cityModel: cityModelFn, mapperOptions }: CityMapperOpts) {
    super(db, cityModelFn(), mapperOptions);
  }

  async list(paramsOrig: Record<string, unknown> = {}): Promise<unknown> {
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
    const page = parseInt(String(params.page ?? 1), 10);
    const skip = (page - 1) * pageSize;

    const sortBy = (params.sort as string) ?? "createdAt";
    const orderBy = parseInt(String(params.order ?? -1), 10);
    const sort: Record<string, number> = {};
    sort[sortBy] = orderBy;

    const parsedParams = this.queryFilter.parse(params) as Record<
      string,
      unknown
    >;
    const query = { ...params, ...parsedParams } as Record<string, unknown>;
    const toDelete = [
      "_count",
      "_pageSize",
      "pageSize",
      "page",
      "fields",
      "deleted",
      "disabled",
      "sort",
      "order",
    ];
    toDelete.forEach((key) => delete query[key]);

    if (withDeleted === "1" || withDeleted === "true") {
      delete query.deleted;
    } else {
      query.deleted = { $ne: true };
    }

    const project: Record<string, number> = {};
    if (params.fields) {
      const fields = (params.fields as string).split(",");
      fields.forEach((field) => {
        if (field.length > 0) {
          project[field] = 1;
        }
      });
    }

    if (
      query.createdAt &&
      typeof query.createdAt === "object" &&
      Object.keys(query.createdAt).length > 0
    ) {
      const createdAt: Record<string, Date> = {};
      Object.keys(query.createdAt as Record<string, unknown>).forEach((key) => {
        createdAt[key] = new Date(
          (query.createdAt as Record<string, unknown>)[key] as string,
        );
      });
      query.createdAt = createdAt;
    }

    if (params.name) {
      query.name = { $regex: new RegExp(String(params.name), "i") };
    }

    const list = await this.collection
      .find(query)
      .project(project)
      .sort(sort as Record<string, 1 | -1>)
      .limit(pageSize)
      .skip(skip)
      .toArray();

    const result: ListResult = {
      result: list,
      page,
    };

    if (withCount === "1" || withCount === "true" || withCount === true) {
      const count = await this.collection.countDocuments(query);
      result.count = count;
      result.page_count = Math.ceil(count / pageSize);
    }

    return this.sanitize(result, "result");
  }

  toHal(result: Record<string, unknown>): InstanceType<typeof hal.Resource> {
    const json = this.toJson(result) as Record<string, unknown>;
    if (result.deleted === true) {
      if (result.deletedAt) json.deletedAt = result.deletedAt;
      if (result.deletedBy) json.deletedBy = result.deletedBy;
    }
    return new hal.Resource(json);
  }

  toHalCollection(result: ListResult): InstanceType<typeof hal.Resource> {
    const entities: InstanceType<typeof hal.Resource>[] = [];
    for (let i = 0; i < result.result.length; i += 1) {
      entities.push(this.toHal(result.result[i] as Record<string, unknown>));
    }
    const paginationData: Record<string, unknown> = {
      _page: result.page,
      _count: entities.length,
    };
    if (Object.prototype.hasOwnProperty.call(result, "count")) {
      paginationData._total_items = result.count ?? 0;
    }
    if (Object.prototype.hasOwnProperty.call(result, "page_count")) {
      paginationData._page_count = result.page_count ?? 1;
    }
    const collection = new hal.Resource(paginationData);
    collection.embed(this.collectionName, entities, false);
    return collection;
  }
}
