import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const pkgDeps = Object.keys(pkg.dependencies)

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'ReduxApiMiddleware',
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        exclude: ['node_modules/**'],
        presets: [
          [
            "@babel/preset-env", {
              modules: false,
              useBuiltIns: "usage"
            }
          ]
        ]
      })
    ]
  },

  // CommonJS (for Node)
  {
    input: 'src/index.js',
    output: {
      file: pkg.main,
      format: 'cjs',
    },
    external: pkgDeps,
    plugins: [
      babel({
        exclude: ['node_modules/**']
      })
    ]
  }
];