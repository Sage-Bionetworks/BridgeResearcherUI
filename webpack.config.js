import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
/*
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
*/
// The ignore plugin in is removing moment.js localization, which takes a lot of room.

module.exports = {
    entry: ['./app/src/routes.js'],
    output: {
        path: path.resolve(__dirname, "app/dist"),
        filename: 'bundle.[hash].js'
    },
    module: {
        rules: [
            {
                test: /\.js/,
                exclude: /(node_modules|browser_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ["es2015"]
                    }
                }
            },
            {
                test: /\.(scss|css)$/, loader: "style-loader!css-loader!sass-loader"
            },
            {
                test: /\.html$/, loader: "html-loader?removeComments=false"
            }
        ]
    },
    devtool: 'source-map',
    plugins: [
        new HtmlWebpackPlugin({template: "app/template.html",filename: "../index.html"}),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ],
    resolve: {
        extensions: ['.css', '.js', '.html','.scss']
    }
}
