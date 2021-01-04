'use strict';

const common = require('./webpack.config.common');
const path = require('path');

console.log('[Webpack] Use dev configuration\n');

module.exports = Object.assign({}, {
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        writeToDisk: true
    }
}, common);
