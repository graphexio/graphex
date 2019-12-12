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
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-optional-chaining',
    [
      '@babel/transform-runtime',
      {
        regenerator: true,
      },
    ],
  ],
};
