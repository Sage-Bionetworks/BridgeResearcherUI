'use strict';
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: path.resolve('./app/src/routes.js')
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve('./app/dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('app/template.html'), 
      filename: path.resolve('./app/index.html')
    })
  ],  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', 
          options: {
            "presets": [["@babel/env", { "modules": false }]],
            "plugins": ["add-module-exports"]
          }
        }
      },
      {
        test: /\.(scss|css)$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      },
      {
        test: /\.html$/, 
        use: {
          loader: 'html-loader', 
          options: {
            removeComments: false, 
            minimize: true
          }
        }
      }    
    ]
  }
};
