'use strict';

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
    module: {
        loaders: [
            { test: /\.(scss|css)$/, loader: "style!css!sass" },
            { test: /\.html$/, loader: "html?removeComments=false&" }
        ]
    },
    resolve: {
        extensions: ['', '.css', '.js', '.html','.scss']
    }
}
