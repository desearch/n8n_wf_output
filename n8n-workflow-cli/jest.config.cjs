/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'json', 'cjs'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    // 'tests/cli.test.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  moduleNameMapper: {
    // This mapper helps Jest resolve imports correctly in ESM projects
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
}; 