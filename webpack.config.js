const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
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
      "zlib": false,
      "process": require.resolve("process/browser")
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
      title: 'BeeTagged',
      templateContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BeeTagged</title>
    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        }
        #root {
            min-height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
</body>
</html>
      `.trim()
    }),
    new webpack.DefinePlugin({
      // Define environment variables for client-side access
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    // Provide process for browser compatibility
    new webpack.ProvidePlugin({
      process: 'process/browser'
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
          from: 'public/test-plain.html', 
          to: 'test-plain.html' 
        },
        { 
          from: 'public/minimal.html', 
          to: 'minimal.html' 
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
        },
        { 
          from: 'public/facebook-test.html', 
          to: 'facebook-test.html' 
        },
        { 
          from: 'public/facebook-diagnostic.html', 
          to: 'facebook-diagnostic.html' 
        },
        { 
          from: 'public/server-auth.html', 
          to: 'server-auth.html' 
        },
        { 
          from: 'public/app.html', 
          to: 'app.html' 
        },
        { 
          from: 'public/server-test.html', 
          to: 'server-test.html' 
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
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:5000'
      }
    ]
  }
};