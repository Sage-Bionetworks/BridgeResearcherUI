'use strict';
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    main: path.resolve('./app/src/routes.js')
  },
  externals: {
    moment: 'moment'
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve('app/dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      template: path.resolve('app/template.html'), 
      filename: path.resolve('app/index.html')
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].css',
      ignoreOrder: false, // Enable to remove warnings about conflicting order
    })
  ],  
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader']
      },
      {
        test: /\.(scss|css)$/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
          options: {publicPath: '../', hmr: process.env.NODE_ENV === 'development'}
        }, 'css-loader', 'sass-loader']
      },
      {
        test: /\.html$/, 
        use: {
          loader: 'html-loader', 
          options: {removeComments: false, minimize: true}
        }
      }    
    ]
  }
};
