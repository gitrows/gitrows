const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './gitrows.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'gitrows.min.js',
		libraryTarget: 'var',
    library: 'Gitrows'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  mode: 'production'
};
