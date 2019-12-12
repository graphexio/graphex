module.exports = {
  ignore: ['**/*.test.js'],
  presets: [
    ['@babel/preset-typescript'],
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
  plugins: [
    ['import-graphql'],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-optional-chaining',
    [
      'babel-plugin-root-import',
      {
        rootPathSuffix: 'src/',
      },
    ],
    [
      '@babel/transform-runtime',
      {
        regenerator: true,
      },
    ],
  ],
};
