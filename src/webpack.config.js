const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const Dotenv = require('dotenv-webpack');


const info = {
  TITLE: 'Sentra'
}

const config = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map',

  devServer: {
    static: path.join(__dirname, '../public'),
    port: 3000,
    host: '0.0.0.0',
    historyApiFallback: true,
    headers: {
      'Cache-Control': 'no-store',
    },
    proxy: {
       '/api': {
            target: 'http://localhost:3000',
            router: () => 'http://localhost:5001', // Points to Firebase Functions emulator
            logLevel: 'debug'
       }
    }
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            experimentalWatchApi: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(ico|png|jpg|svg)$/i,
        use: ['file-loader'],
      },
    ]
  },

  resolve: {
    extensions: [
      '.tsx', '.ts', '.js', '.jsx', '.json'
    ]
  },

  entry: {
    main: './src/index.tsx' // Note: this is relative to where webpack.config.js is located
  },

  output: {
    filename: '[name].[hash].js', // chunkhash
    path: path.resolve(__dirname, '../public'),
    publicPath: '/'
  },

  plugins: [
    new ProgressBarPlugin({ width: 80 }),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['**/*', '!firebase-debug*', '!__/**'],
    }),
    // Using the older format for CopyWebpackPlugin (array format)
    new CopyWebpackPlugin([
      { from: './src/img', to: 'img' }
    ], {
      ignore: ['.gitkeep']
    }),
    new MiniCssExtractPlugin({
      filename: '[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: info.TITLE,
      chunks: ['main'],
      template: './src/index.html',
      templateParameters: { TITLE: info.TITLE },
      inject: true
    }),
    new Dotenv({
      path: './.env.local', // Path to .env file
      systemvars: true // Load all system variables as well
    }),
  ],
}

module.exports = [ config ];