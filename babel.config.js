module.exports = function(api) {
  const env = api.cache(() => process.env.NODE_ENV);

  const nodeTarget = env === 'test' ? 'current' : '8';
  const envModules = env === 'test' ? 'commonjs' : false;

  const presets = [
    [
      '@babel/preset-env',
      {
        modules: envModules,
        useBuiltIns: 'entry',
        corejs: '3.6.4',
        targets: {
          node: nodeTarget
        }
      }
    ]
  ];

  const plugins = [];

  return {
    presets,
    plugins
  };
};
