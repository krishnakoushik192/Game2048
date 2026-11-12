module.exports = {
  preset: 'react-native',
  setupFiles: ['react-native-gesture-handler/jestSetup', '<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
  // These packages ship untranspiled ES modules, so Jest must run them through Babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@react-native-vector-icons|react-native-safe-area-context|react-native-screens|nativewind|react-native-css-interop)/)',
  ],
};
