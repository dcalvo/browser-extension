const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: "development",
    devtool: "inline-source-map",

    entry: {
        background: './src/app/background.ts',
        intercept: './src/app/intercept.ts',
    },

    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: '[name].js'
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },

    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] }
        ]
    },

    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, 'dist')]
        }),
        
        new CopyWebpackPlugin({
            patterns: [
                { 
                    from: '**/*', 
                    to: '../',
                    context: path.resolve(__dirname, 'public')
                }
            ]
        }),

    ],

};
