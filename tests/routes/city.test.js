const supertest = require("supertest");
const defaults = require("superagent-defaults");

const app = require("../../index");
const { AuthorizationHeader } = require("../common.testcases");

describe("City", () => {
  let authHeaders;
  let request;

  beforeAll(async () => {
    request = defaults(supertest(app));
  });

  describe("If it's not logged in", () => {
    const cityId = "123";

    it("Should not create cities", async () => {
      const res = await request.post(`/v1/city`);
      expect(res.statusCode).toBe(401);
    });

    it("Should not get city", async () => {
      const res = await request.get(`/v1/city/${cityId}`);
      expect(res.statusCode).toBe(401);
    });

    it("Should not update city", async () => {
      const res = await request.put(`/v1/city/${cityId}`);
      expect(res.statusCode).toBe(401);
    });

    it("Should not list cities", async () => {
      const res = await request.get(`/v1/city`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe("If invalid body or wrong parameters", () => {
    const cityId = "123";

    beforeAll(async () => {
      const auth = AuthorizationHeader();
      authHeaders = { Authorization: auth };
      request.set(authHeaders);
    });

    it("Should not create cities", async () => {
      const res = await request.post(`/v1/city`).send();
      expect(res.statusCode).toBe(422);
    });

    it("Should not get city", async () => {
      const res = await request.get(`/v1/city/${cityId}`);
      expect(res.statusCode).toBe(404);
    });

    it("Should not update city", async () => {
      const res = await request.put(`/v1/city/${cityId}`);
      expect(res.statusCode).toBe(422);
    });
  });

  describe("If it's authenticated and with all valid parameters", () => {
    let cityId = null;
    let stateId = '04696d2e-9421-4443-a927-21275c86026b';

    beforeAll(async () => {
      const auth = AuthorizationHeader();
      authHeaders = { Authorization: auth };
      request.set(authHeaders);
    });

    it("Should create cities", async () => {
      const cityPayload = {
        name: 'Rio de Janeiro',
        stateId
      }
      const res = await request.post(`/v1/city`).send(cityPayload);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      cityId = res.body.id;
      expect(res.body.stateId).toBe('04696d2e-9421-4443-a927-21275c86026b');
    });

    it("Should get city", async () => {
      const res = await request.get(`/v1/city/${cityId}`);
      expect(res.statusCode).toBe(200);
    });

    it("Should update city", async () => {
      const cityPayload = {
        name: "Rio de Janeiro 2",
        stateId,
      };
      const res = await request.put(`/v1/city/${cityId}`).send(cityPayload);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body.name).toBe('Rio de Janeiro 2');
    });

    it("Should list cities", async () => {
      const res = await request.get(`/v1/city`);
      expect(res.statusCode).toBe(200);
    });
  });

  afterAll((done) => {
    app.close(done);
  });
});
