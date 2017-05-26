var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

// The ignore plugin in is removing moment.js localization, which takes a lot of room.

module.exports = {
    devtool: 'source-map',
    entry: ['./app/src/routes.js'],
    output: {
        path: './app/dist',
        filename: 'bundle.[hash].js'
    },
    module: {
        preLoaders: [
            { test: /\.js/, include: /app\/src/, loader: "jshint-loader" }  
        ],
        loaders: [
            { test: /\.(scss|css)$/, loader: "style!css!sass" },
            { test: /\.html$/, loader: "html?removeComments=false" }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({template: "app/template.html",filename: "../index.html"}),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ],
    resolve: {
        extensions: ['', '.css', '.js', '.html','.scss']
    },
    jshint: {
        emitErrors: true
    }
}
