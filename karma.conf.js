var RewirePlugin = require("rewire-webpack");

module.exports = function(config) {
    config.set({
        files: ['./node_modules/phantomjs-polyfill-object-assign/object-assign-polyfill.js',
            'test/*.test.js', 'test/**/*.test.js'],
        plugins: ['karma-mocha', 'karma-webpack', 'karma-phantomjs-launcher', 'karma-sourcemap-loader'],
        frameworks: ['mocha'],        
        preprocessors: {
            'test/*.test.js': ['webpack','sourcemap'],
            'test/**/*.test.js': ['webpack','sourcemap']
        },
        // This should, more or less, be a copy of webpack.config.js
        webpack: {
            devtool: 'sourcemap',
            entry: ['./app/src/routes.js'],
            output: {path: './app/dist', filename: 'bundle.js'},
            plugins: [new RewirePlugin()],
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
            jshint: { emitErrors: true }            
        },
        webpackMiddleware: { noInfo: true }
    });
};
