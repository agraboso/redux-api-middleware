module.exports = {
  type: 'web-module',
  polyfill: false,
  npm: {
    esModules: true,
    umd: {
      global: 'ReduxApiMiddleware',
      externals: {}
    }
  },
  webpack: {
    // Enables partial scope hoisting with Webpack 3's ModuleConcatenationPlugin
    hoisting: true
  },
  karma: {
    testFiles: 'test/index.js',
    browsers: ['PhantomJS'],
    frameworks: ['tap'],
    plugins: [
      require('karma-tap')
    ],
    reporters: [
      require('karma-tap-pretty-reporter')
    ],
    extra: {
      tapReporter: {
        prettify: require('tap-spec'),
        separator: '****************************'
      },
    }
  }
}
