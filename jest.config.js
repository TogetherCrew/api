/* eslint-env node */
module.exports = {
  testPathIgnorePatterns: [
    '/__tests__/fixtures',
    '/__tests__/utils'
  ],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  collectCoverage: true,
  testEnvironment: 'node',
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts*'
  ],
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 50,
      lines: 60,
      statements: 10
    }
  }
}
