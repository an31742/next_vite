module.exports = {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    // 添加throw表达式支持
    '@babel/plugin-syntax-throw-expressions',
  ]
};
