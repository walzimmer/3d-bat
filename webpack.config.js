const webpack = require('webpack');
const path = require('path');

const config = {
    entry: './reactTest.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            }
        ]
    },
    mode: 'production'
};
module.exports = config;