'use strict';

module.exports = {
    entry: './app/src/main.js',
    output: {
        filename: './app/dist/bundle.js'
    },
    module: {
        loaders: [
            { test: /\.(scss|css)$/, loader: "style!css!sass" },
            { test: /\.html$/, loader: "html" }
        ]
    },
    resolve: {
        extensions: ['', '.css', '.js', '.html','.scss']
    }
}
