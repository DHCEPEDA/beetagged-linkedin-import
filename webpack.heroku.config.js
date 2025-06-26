const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "path": false,
      "os": false,
      "crypto": false,
      "stream": false,
      "http": false,
      "https": false,
      "zlib": false,
      "process": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: 'body'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: 'public/images', 
          to: 'images',
          noErrorOnMissing: true
        },
        { 
          from: 'public/*.html', 
          to: '[name][ext]',
          noErrorOnMissing: true
        },
        { 
          from: 'public/app-config.js', 
          to: 'app-config.js',
          noErrorOnMissing: true
        }
      ],
    }),
  ],
  optimization: {
    minimize: true
  }
};