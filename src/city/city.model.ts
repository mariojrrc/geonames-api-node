export interface CitySchemaDef {
  name: string;
  collectionName: string;
  type: string;
  properties: Record<string, unknown>;
  additionalProperties: boolean;
  required: string[];
  searchable: string[];
}

export default (): CitySchemaDef => ({
  name: "cities",
  collectionName: "cities",
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
    stateId: { type: "string", format: "uuid" },
    createdAt: { instanceOf: "Date" },
    updatedAt: { instanceOf: "Date" },
  },
  additionalProperties: false,
  required: ["name", "stateId"],
  searchable: ["createdAt", "updatedAt", "name", "stateId"],
});
