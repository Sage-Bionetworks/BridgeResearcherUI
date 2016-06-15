//var webpack = require('webpack');

module.exports = {
    entry: './app/src/routes.js',
    output: {
        path: './app/dist',
        filename: 'bundle.js'
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
    /*
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                drop_console: true
            }
        })
    ],
    */
    resolve: {
        extensions: ['', '.css', '.js', '.html','.scss']
    },
    jshint: {
        emitErrors: true
    }
}
