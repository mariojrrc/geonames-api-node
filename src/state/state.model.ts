export interface StateSchemaDef {
  name: string;
  collectionName: string;
  type: string;
  properties: Record<string, unknown>;
  additionalProperties: boolean;
  required: string[];
  searchable: string[];
}

export default (): StateSchemaDef => ({
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
