var HtmlWebpackPlugin = require('html-webpack-plugin');

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
    plugins: [new HtmlWebpackPlugin({
        title: "This is the title",
        template: "app/template.html",
        filename: "../index.html"
    })],
    resolve: {
        extensions: ['', '.css', '.js', '.html','.scss']
    },
    jshint: {
        emitErrors: true
    }
}
