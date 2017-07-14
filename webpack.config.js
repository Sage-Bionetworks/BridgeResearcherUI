const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    filename: "[name].[hash].css",
    disable: process.env.NODE_ENV === "development"
});

// The ignore plugin in is removing moment.js localization, which takes a lot of room.

module.exports = {
    entry: {
        bundle: './app/src/routes.js'
    },
    output: {
        path: path.resolve(__dirname, "app/dist"),
        filename: '[name].[hash].js'
    },
    module: {
        rules: [
            {
                test: /\.js/,
                exclude: /(node_modules|browser_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ["es2015"]
                    }
                }
            },
			{
				test: /\.js/,
				enforce: "pre",
				exclude: /(node_modules|browser_components|lib)/,
				use: [
					{
                        loader: "jshint-loader",
                        options: {
                            esversion: 6
                        }
                    }
				]
			},
            {
                test: /\.(scss|css)$/, 
                use: extractSass.extract({
                    use: [
                        {loader: "css-loader"}, 
                        {loader: "sass-loader"}
                    ],
                    fallback: "style-loader"
                })
            },
            {
                test: /\.html$/, 
                use: {
                    loader: 'html-loader',
                    options: {
                        removeComments: false,
                        minimize: true
                    }
                }
            }
        ]
    },
    devtool: 'source-map',
    plugins: [
        new HtmlWebpackPlugin({template: "app/template.html", filename: "../index.html"}),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        extractSass
    ],
    resolve: {
        extensions: ['.css', '.js', '.html','.scss']
    }
}
