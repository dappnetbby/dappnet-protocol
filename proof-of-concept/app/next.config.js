// const webpack = require('webpack')
const info = require('../webtorrent/package.json')

const webtorrentConfig = {
  entry: './index.js',
    devtool: 'source-map',
      resolve: {
    aliasFields: ['browser'],
      alias: {
      ...info.browser,
        path: 'path-esm'
    }
  },
  output: {
    chunkFormat: 'module',
      filename: 'webtorrent.min.js',
        library: {
      type: 'module'
    }
  },
  mode: 'production',
    target: 'web',
      experiments: {
    outputModule: true
  },
  plugins: [
    // new webpack.ProvidePlugin({
    //   process: '/polyfills/process-fast.js'
    // }),
    // new webpack.DefinePlugin({
    //   global: 'globalThis'
    // })
  ],
  //   optimization: {
  //   minimize: true,
  //     minimizer: [new TerserPlugin({
  //       terserOptions: {
  //         format: {
  //           comments: false
  //         }
  //       },
  //       extractComments: false
  //     })]
  // }
}

module.exports = {
  // fix for: https://github.com/rainbow-me/rainbowkit/issues/836#issuecomment-1303571558
  reactStrictMode: false,

  // webpack: (config, options) => {
  //   const { isServer } = options;

  //   config.module.rules.push({
  //     test: /node_modules\/webtorrent/,
  //     ...webtorrentConfig
  //     // use: [
  //     //   {
  //     //     // loader: 'webpack-cli/lib/loader',
  //     //     options: webtorrentConfig
  //     //   }
  //     // ]
  //     // use: [
  //     //   {
  //     //     // loader: 'raw-loader',
  //     //     ...options.defaultLoaders.babel,
  //     //     options: {
  //     //       ...options.defaultLoaders.babel.options,
  //     //       target: 'web'
  //     //     }
  //     //   }
  //     // ]
  //   });

  //   return config;
  // }

}
