const supertest = require("supertest");
const defaults = require("superagent-defaults");

const app = require("../../index");
const { AuthorizationHeader } = require("../common.testcases");

describe("State", () => {
  let authHeaders;
  let request;

  beforeAll(async () => {
    request = defaults(supertest(app));
  });

  describe("If it's not logged in", () => {
    const stateId = "123";

    it("Should not create states", async () => {
      const res = await request.post(`/v1/state`);
      expect(res.statusCode).toBe(401);
    });

    it("Should not get state", async () => {
      const res = await request.get(`/v1/state/${stateId}`);
      expect(res.statusCode).toBe(401);
    });

    it("Should not update state", async () => {
      const res = await request.put(`/v1/state/${stateId}`);
      expect(res.statusCode).toBe(401);
    });

    it("Should not delete state", async () => {
      const res = await request.delete(`/v1/state/${stateId}`);
      expect(res.statusCode).toBe(401);
    });

    it("Should not list states", async () => {
      const res = await request.get(`/v1/state`);
      expect(res.statusCode).toBe(401);
    });

    it("Should not bulk states", async () => {
      const res = await request.get(`/v1/state/bulk`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe("If invalid body or wrong parameters", () => {
    const stateId = "123";

    beforeAll(async () => {
      const auth = AuthorizationHeader();
      authHeaders = { Authorization: auth };
      request.set(authHeaders);
    });

    it("Should not create states", async () => {
      const res = await request.post(`/v1/state`).send();
      expect(res.statusCode).toBe(422);
    });

    it("Should not get state", async () => {
      const res = await request.get(`/v1/state/${stateId}`);
      expect(res.statusCode).toBe(404);
    });

    it("Should not update state", async () => {
      const res = await request.put(`/v1/state/${stateId}`);
      expect(res.statusCode).toBe(422);
    });

    it("Should not delete state", async () => {
      const res = await request.delete(`/v1/state/${stateId}`);
      expect(res.statusCode).toBe(404);
    });

    it("Should not bulk states", async () => {
      const res = await request.post(`/v1/state/bulk`);
      expect(res.statusCode).toBe(400);
    });
  });

  describe("If it's authenticated and with all valid parameters", () => {
    let stateId = null;

    beforeAll(async () => {
      const auth = AuthorizationHeader();
      authHeaders = { Authorization: auth };
      request.set(authHeaders);
    });

    it("Should create states", async () => {
      const statePayload = {
        name: 'Rio de Janeiro',
        shortName: 'RJ'
      }
      const res = await request.post(`/v1/state`).send(statePayload);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      stateId = res.body.id;
    });

    it("Should get state", async () => {
      const res = await request.get(`/v1/state/${stateId}`);
      expect(res.statusCode).toBe(200);
    });

    it("Should update state", async () => {
      const statePayload = {
        name: "Rio de Janeiro 2",
        shortName: "RJ",
      };
      const res = await request.put(`/v1/state/${stateId}`).send(statePayload);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name');
      expect(res.body.name).toBe('Rio de Janeiro 2');
    });

    it("Should list states", async () => {
      const res = await request.get(`/v1/state`);
      expect(res.statusCode).toBe(200);
    });

    it("Should bulk states", async () => {
      // add one more state
      const statePayload = {
        name: 'Rio de Janeiro',
        shortName: 'RJ'
      }
      const res = await request.post(`/v1/state`).send(statePayload);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      const stateId2 = res.body.id;

      const bulkResponse = await request.post(`/v1/state/bulk`).send({ids: [ stateId, stateId2 ]});
      expect(bulkResponse.statusCode).toBe(200);
      expect(bulkResponse.body).toHaveLength(2);
    });

    it("Should delete state", async () => {
      const statePayload = {
        name: "Rio de Janeiro 3",
        shortName: "RJ",
      };
      const newStateRes = await request.post(`/v1/state`).send(statePayload);
      expect(newStateRes.statusCode).toBe(201);
      expect(newStateRes.body.name).toBe('Rio de Janeiro 3')
      const res = await request.delete(`/v1/state/${newStateRes.body.id}`);
      expect(res.statusCode).toBe(204);
    });
  });

  afterAll((done) => {
    app.close(done);
  });
});
