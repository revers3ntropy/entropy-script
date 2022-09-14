const path = require('path');

module.exports = {
    entry: path.join(path.resolve(__dirname), './src/index.ts'),
    output: {
        filename: './cli.js',
        path: path.join(path.resolve(__dirname), '../')
    },
    mode: 'production',
    // very important lol
    target: 'node',
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFile: path.join(path.resolve(__dirname), 'tsconfig.json')
                }
            }
        ]
    },
    devtool: 'source-map',
    optimization: {
        // sadly must be false to support the MySQL module
        minimize: false
    }
};