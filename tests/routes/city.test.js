const path = require("path");
const fs = require("fs");
const supertest = require("supertest");
const defaults = require("superagent-defaults");

const { AuthorizationHeader, dropCollection, populateCollection } = require("../common.testcases");
const useDist =
  process.env.NODE_ENV === "test" &&
  fs.existsSync(path.join(__dirname, "../../dist/infra/mongo.js"));
const mongoConnection = require(
  useDist ? path.join(__dirname, "../../dist/infra/mongo") : "../../infra/mongo"
);

describe("City", () => {
  let app;
  let authHeaders;
  let request;

  beforeAll(async () => {
    const appOrServer = await require("../../index");
    const agent = typeof appOrServer.callback === "function" ? appOrServer.callback() : appOrServer;
    app = appOrServer;
    request = defaults(supertest(agent));
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
      expect(res.body).toHaveProperty("id");
      cityId = res.body.id;
      expect(res.body.stateId).toBe(stateId);
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

    it("Should empty list cities with name filter", async () => {
      const res = await request.get(`/v1/city?name=xyz`);
      expect(res.statusCode).toBe(200);
      expect(res.body._embedded.cities.length).toBe(0);
    });

    it("Should list cities with name filter", async () => {
      const res = await request.get(`/v1/city?name=Rio`);
      expect(res.statusCode).toBe(200);
      expect(res.body._embedded.cities.length).toBe(1);
    });

    it("Should list cities with stateId filter", async () => {
      const getRes = await request.get(`/v1/city/${cityId}`);
      expect(getRes.statusCode).toBe(200);
      const filterByStateId = getRes.body.stateId;

      console.log(getRes.body);

      console.log(filterByStateId);
      const res = await request.get(`/v1/city?stateId=${filterByStateId}`);
      expect(res.statusCode).toBe(200);
      console.log(res.body._embedded.cities);
      expect(res.body._embedded.cities.length).toBeGreaterThanOrEqual(1);
      res.body._embedded.cities.forEach((c) => {
        expect(c.stateId).toBe(filterByStateId);
      });
    });
  });

  afterAll(async () => {
    await dropCollection("cities");
    if (app && typeof app.close === "function") {
      await new Promise((resolve) => app.close(resolve));
    }
    await mongoConnection.close();
  });
});
