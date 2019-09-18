const { defaults } = require('jest-config');

module.exports = {
  testEnvironment: 'node',
  testMatch: null,
  testRegex: '\\.test\\.(js|ts)$',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
