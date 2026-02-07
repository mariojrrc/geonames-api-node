/* eslint-disable radix, no-underscore-dangle */
const hal = require("hal");
const BaseMapper = require("../common/baseMapper");

class StateMapper extends BaseMapper {
  constructor({ db, stateModel, mapperOptions }) {
    super(db, stateModel(), mapperOptions);
  }

  async list(paramsOrig = {}) {
    const params = JSON.parse(JSON.stringify(paramsOrig));

    const withDeleted = params.deleted || params.disabled || false;
    const withCount = params._count || false;
    const pageSize = parseInt(
      params._pageSize || params.pageSize || this.pageSize,
    );
    const page = parseInt(params.page || 1);
    const skip = (page - 1) * pageSize;

    const sortBy = params.sort || "createdAt";
    const orderBy = parseInt(params.order || -1);
    const sort = {};
    sort[sortBy] = orderBy;

    const parsedParams = this.queryFilter.parse(params);

    const query = { ...params, ...parsedParams };
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

    const project = {};
    if (params.fields) {
      const fields = params.fields.split(",");
      fields.forEach((field) => {
        if (field.length > 0) {
          project[field] = 1;
        }
      });
    }

    if (query.createdAt && Object.keys(query.createdAt).length > 0) {
      const createdAt = {};
      Object.keys(query.createdAt).forEach((key) => {
        createdAt[key] = new Date(query.createdAt[key]);
      });
      query.createdAt = createdAt;
    }

    if (params.name) query.name = { $regex: new RegExp(`${params.name}`, "i") };

    if (params.shortName)
      query.shortName = { $regex: new RegExp(`${params.shortName}`, "i") };

    const list = await this.collection
      .find(query)
      .project(project)
      .sort(sort)
      .limit(pageSize)
      .skip(skip)
      .toArray();

    const result = {
      result: list,
      page,
    };

    if (withCount === "1" || withCount === "true" || withCount === true) {
      const count = await this.collection.find(query).count();
      result.count = count;
      result.page_count = Math.ceil(count / pageSize);
    }

    return this.sanitize(result, "result");
  }

  toHal(result) {
    const json = this.toJson(result);
    if (result.deleted === true) {
      if (result.deletedAt) {
        json.deletedAt = result.deletedAt;
      }
      if (result.deletedBy) {
        json.deletedBy = result.deletedBy;
      }
    }
    return new hal.Resource(json);
  }

  toHalCollection(result) {
    const entities = [];

    for (let i = 0; i < result.result.length; i += 1) {
      entities.push(this.toHal(result.result[i]));
    }

    const paginationData = {
      _page: result.page,
      _count: entities.length,
    };

    if (Object.prototype.hasOwnProperty.call(result, "count")) {
      paginationData._total_items = result.count || 0;
    }
    if (Object.prototype.hasOwnProperty.call(result, "page_count")) {
      paginationData._page_count = result.page_count || 1;
    }

    const collection = new hal.Resource(paginationData);

    collection.embed(this.collectionName, entities, false);
    return collection;
  }
}

module.exports = StateMapper;
