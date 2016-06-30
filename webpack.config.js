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
    resolve: {
        extensions: ['', '.css', '.js', '.html','.scss']
    },
    jshint: {
        emitErrors: true
    }
}
