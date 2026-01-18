const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],
  // Exclude backend from root tests (run backend tests separately)
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/backend/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.stories.{ts,tsx}',
  ],
};

// Export an async function that properly overrides transformIgnorePatterns
// This is necessary because next/jest sets its own transformIgnorePatterns
module.exports = async () => {
  const jestConfig = await createJestConfig(customJestConfig)();

  // Override transformIgnorePatterns to handle ESM modules like lucide-react
  jestConfig.transformIgnorePatterns = [
    '/node_modules/(?!(lucide-react|@radix-ui|class-variance-authority|clsx|tailwind-merge)/)',
  ];

  return jestConfig;
};
