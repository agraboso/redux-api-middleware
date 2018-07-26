module.exports = function (api) {
  const env = api.cache(() => process.env.NODE_ENV);

  const nodeTarget = env === 'test' ? 'current' : '8';
  const envModules = env === 'test' ? 'commonjs' : false;

  const presets = [
    [
      "@babel/preset-env", {
        modules: envModules,
        "useBuiltIns": "usage",
        "targets": {
          "node": nodeTarget
        },
      }
    ]
  ];

  const plugins = [];

  return {
    presets,
    plugins
  };
}