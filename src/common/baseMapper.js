/* eslint-disable no-param-reassign */
const { CrudMapper } = require("koa-mongo-crud");

class BaseMapper extends CrudMapper {
  async findById(id, withDeleted = false) {
    return this.detail(id, withDeleted);
  }

  async bulk(ids) {
    return this.collection.find({ _id: { $in: ids } }).toArray();
  }

  async findOne(params, options) {
    const one = await this.collection.findOne(params, options);
    return this.sanitize(one);
  }

  sanitize(data, key) {
    if (data == null) {
      return data;
    }

    let sanitized = data;
    if (key != null) {
      sanitized = data[key];
    }

    if (Array.isArray(sanitized)) {
      sanitized = sanitized.map(this.renameId);
    } else {
      sanitized = this.renameId(sanitized);
    }

    if (key != null) {
      data[key] = sanitized;
    } else {
      data = sanitized;
    }
    return data;
  }

  renameId(record) {
    const result = { id: record._id, ...record };
    delete result._id;
    return result;
  }

  async count(query) {
    return this.collection.countDocuments(query);
  }

  async detail(id, withDeleted = false) {
    const one = await super.detail(id, withDeleted);
    return this.sanitize(one);
  }

  async list(paramsOrig, aggregateParam) {
    const data = await super.list(paramsOrig, aggregateParam);
    return this.sanitize(data, "result");
  }

  async create(post) {
    post = this.validateAll(post);
    const data = this.toDatabase(post);

    await this.checkUniqueness(data);

    if (Object.prototype.hasOwnProperty.call(data, "_id") === false) {
      data._id = CrudMapper.generateUuid();
    }
    data.createdAt = new Date();
    data.updatedAt = data.createdAt;
    await this.collection.insertOne(data);

    return this.sanitize(data);
  }

  async update(id, post, withDeleted = false) {
    const updated = await super.update(id, post, withDeleted);
    return this.sanitize(updated);
  }

  async delete(id) {
    const deleted = await super.delete(id);
    return this.sanitize(deleted);
  }
}

module.exports = BaseMapper;
