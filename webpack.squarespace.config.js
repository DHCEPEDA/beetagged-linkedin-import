const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/SquarespaceApp.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'beetagged-app-bundle.js',
    library: 'BeeTaggedApp',
    libraryTarget: 'umd',
    globalObject: 'this'
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
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
};