'use strict';
var CompressionPlugin = require("compression-webpack-plugin");

/**
 * Firefox throws errors when you run this app in the webpack dev server environment,
 * these errors are not present if you remove the /webpack-dev-server/ pack and give up
 * hot reloading.
 */
module.exports = {
    entry: './app/src/main.js',
    output: {
        path: './app/dist',
        filename: 'bundle.js'
    },
    plugins: [
        new CompressionPlugin({asset: "{file}.gz", algorithm: "gzip", regExp: /\.js$/, threshold: 10240, minRatio: 0.8})
    ],
    module: {
        loaders: [
            { test: /\.(scss|css)$/, loader: "style!css!sass" },
            { test: /\.html$/, loader: "html?removeComments=false" }
        ]
    },
    resolve: {
        extensions: ['', '.css', '.js', '.html','.scss']
    }
}
