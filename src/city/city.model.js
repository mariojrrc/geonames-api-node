module.exports = () => ({
  name: "cities",
  collectionName: "cities",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    stateId: { type: "string", format: 'uuid' },
    createdAt: { instanceOf: "Date" },
    updatedAt: { instanceOf: "Date" },
  },
  additionalProperties: false,
  required: ["name", "stateId"],
  searchable: ["createdAt", "updatedAt", "name", "stateId"],
});
