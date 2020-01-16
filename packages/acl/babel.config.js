module.exports = {
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
    ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
  ],
};
