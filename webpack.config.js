module.exports = {
    entry: './app/src/main.js',
    output: {
        filename: './app/dist/bundle.js'
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /\.html$/, loader: "html" }
        ]
    },
    resolve: {
        extensions: ['', '.css', '.js', '.html']
    }
}
