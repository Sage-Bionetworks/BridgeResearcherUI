'use strict';

const common = require('./webpack.config.common');
const path = require('path');

console.log('[Webpack] Use dev configuration\n');

module.exports = Object.assign({}, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: './app',
        watchFiles: ['./app/src/**']
    }
}, common);
