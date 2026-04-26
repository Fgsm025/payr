/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/lib/apiBaseUrl$': '<rootDir>/src/test/jestApiBaseUrl.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: false,
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          skipLibCheck: true,
          baseUrl: '.',
          paths: { '@/*': ['src/*'] },
          types: ['node', 'jest', '@testing-library/jest-dom'],
        },
      },
    ],
  },
}
