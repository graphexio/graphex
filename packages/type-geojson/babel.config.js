module.exports = {
  ignore: ['**/*.test.js'],
  presets: [['@babel/preset-typescript']],
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
