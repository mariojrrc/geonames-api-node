module.exports = () => ({
  name: "states",
  collectionName: "states",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    shortName: { type: "string", minLength: 1, maxLength: 3 },
    createdAt: { instanceOf: "Date" },
    updatedAt: { instanceOf: "Date" },
  },
  additionalProperties: false,
  required: ["name", "shortName"],
  searchable: ["createdAt", "updatedAt", "name", "shortName"],
});
