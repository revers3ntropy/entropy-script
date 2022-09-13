const path = require('path');
const fs = require("fs");

const packageConf = JSON.parse(String(fs.readFileSync('./package.json')));
const version = packageConf['version'];

module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: version + '.js',
        path: path.resolve(__dirname, 'build'),
        library: 'es',
        libraryTarget: 'umd',
        globalObject: 'this'
    },
    mode: 'production',
    devtool: 'source-map',
};