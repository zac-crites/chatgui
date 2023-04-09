/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/src/test/stylemock.js',
    "react-markdown": "<rootDir>/node_modules/react-markdown/react-markdown.min.js"
  }
};