const supertest = require("supertest");
const defaults = require("superagent-defaults");

const { AuthorizationHeader, dropCollection, populateCollection } = require("../common.testcases");
const mongoConnection = require("../../infra/mongo");

describe("State", () => {
  let app;
  let authHeaders;
  let request;

  beforeAll(async () => {
    app = await require("../../index");
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

    it("Should empty list states with name filter", async () => {
      const res = await request.get(`/v1/state?name=xyz`);
      expect(res.statusCode).toBe(200);
      expect(res.body._embedded.states.length).toBe(0);
    });

    it("Should list states with name filter", async () => {
      const res = await request.get(`/v1/state?name=Rio`);
      expect(res.statusCode).toBe(200);
      expect(res.body._embedded.states.length).toBe(1);
    });

    it("Should bulk states", async () => {

      const now = new Date();
      const state1 = {
        _id: '4e62dba1-88be-4301-ae36-93a61455772b',
        name: 'Rio',
        shortName: 'RJ',
        createdAt: now,
        updatedAt: now,
      }
      const state2 = {
        _id: '4e62dba1-88be-4301-ae36-93a61455772c',
        name: 'São Paulo',
        shortName: 'SP',
        createdAt: now,
        updatedAt: now,
      }

      await populateCollection('states', [state1, state2]);
      const bulkResponse = await request.post(`/v1/state/bulk`).send({ids: [ state1._id, state2._id ]});
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

  afterAll(async () => {
    await dropCollection("states");
    await new Promise((resolve) => app.close(resolve));
    await mongoConnection.close();
  });
});
