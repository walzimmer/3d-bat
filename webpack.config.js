const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
    entry: './src/application/index.ts',
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js'
    },
    devtool: 'inlin-source-map',
    devServer: {
        contentBase: './',
        open: true,
        port: 9001,
        proxy: {
            '/predict_rotation': {
                target: 'http://127.0.0.1:5000'
            },
            '/save_annotations': {
                target: 'http://127.0.0.1:5000'
            },
            '/connect-to-workstation': {
                target: 'http://127.0.0.1:5000',
            },
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/application/index.html'
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }, 
            {
                test: /\.css$/,
                use: [{
                    loader: "style-loader"
                }, {
                    loader: "css-loader"
                }]
            },
            {
                test: /\.(png|jpe?g|gif|jp2|webp)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                }
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },

}