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
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "string_decoder": require.resolve("string_decoder/"),
      "buffer": require.resolve("buffer/"),
      fs: false
    }
  },
  mode: 'production',
};
