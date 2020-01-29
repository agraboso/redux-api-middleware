module.exports = {
  verbose: !!process.env.CI,
  automock: false,
  resetMocks: true,
  restoreMocks: true,
  resetModules: true,
  setupFiles: ["./test/setupJest.js"],
  moduleNameMapper: {
    "^redux-api-middleware$": process.env.TEST_LIB ? ".." : "./index"
  }
};
