const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/niacin.ts',
    devtool: 'inline-source-map',
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'niacin.js',
        path: path.resolve(__dirname, 'dist'),
    },
};