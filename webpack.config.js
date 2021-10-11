const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    node: {
        child_process: "empty"
    },
    mode: 'production',
    devtool: 'eval-source-map',
    entry: './src/app.ts',
    module: {
        rules: [
            {
                test: /\.worker\.(c|m)?js$/i,
                use: { loader: "worker-loader" }
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                include: [path.resolve(__dirname, 'src')]
            },
            {
                test: /\.(glsl|vert|frag)$/,
                use: { loader: 'webpack-glsl-loader'},
            },
            {
                test: /\.css$$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.pug$/,
                loader: 'html-loader?attributes=false'
            },
            {
                test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.pug$/,
                loader: 'pug-html-loader'
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.worker']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        library: undefined,
        libraryTarget: 'umd'
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/views/index.pug',
            inject: false
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: 'src/views/css', to: 'css'},
                {from: 'src/views/img', to: 'img'},
                {from: 'src/views/models', to: 'models'},
                {from: 'node_modules/@digitalmasterpieces/arctic-core', to: './arctic-core'},
                "src/effects/resources/schema.zip",
                "src/effects/resources/color2gray_simple.zip",
                "src/effects/resources/color_lut_2d.zip",
                "src/effects/resources/toon.zip",
                "src/effects/resources/oilpaint.zip",
                "src/effects/resources/watercolor.zip",
                "src/effects/resources/20sCam.zip",
            ]
        })
    ],
    // stats: { assets: false},
};