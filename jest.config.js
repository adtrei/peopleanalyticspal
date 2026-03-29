const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterFramework: [],
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react" } }],
  },
};

module.exports = createJestConfig(customJestConfig);
