'use strict';

const common = require('./webpack.config.common');
const path = require('path');

console.log('[Webpack] Use dev configuration\n');

module.exports = Object.assign({}, {
    mode: 'development',
    optimization: {
      minimize: false
    },
    devtool: 'inline-source-map',
    devServer: {
        historyApiFallback: true,
        static: './app',
        watchFiles: ['./app/src/**']
    }
}, common);
