/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  transformIgnorePatterns: []
};
