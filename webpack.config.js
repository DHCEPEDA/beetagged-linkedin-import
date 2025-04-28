const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
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
      "zlib": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new webpack.DefinePlugin({
      // Define environment variables for client-side access
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.FACEBOOK_APP_ID': JSON.stringify(process.env.FACEBOOK_APP_ID || '')
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: 'public/images', 
          to: 'images' 
        },
        { 
          from: 'public/test.html', 
          to: 'test.html' 
        },
        { 
          from: 'public/converter.html', 
          to: 'converter.html' 
        },
        { 
          from: 'public/debug.html', 
          to: 'debug.html' 
        },
        { 
          from: 'public/app-config.js', 
          to: 'app-config.js' 
        },
        { 
          from: 'public/check-react.html', 
          to: 'check-react.html' 
        }
      ],
    }),
  ],
  devServer: {
    historyApiFallback: true,
    static: [
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/'
      },
      {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/'
      }
    ],
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8000'
      }
    ]
  }
};