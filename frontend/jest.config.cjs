module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(idb|dayjs|lz-string|framer-motion|lucide-react|react-router-dom|react-router|@remix-run|turbo-stream)/)',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^idb$': '<rootDir>/__mocks__/idb.js',
    '^lz-string$': '<rootDir>/__mocks__/lz-string.js',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^framer-motion$': '<rootDir>/__mocks__/framer-motion.js',
    '^react-router-dom$': '<rootDir>/__mocks__/react-router-dom.js',
  },
  globals: {
    'import.meta': { env: { VITE_API_URL: 'http://localhost:5000/api' } },
  },
};
