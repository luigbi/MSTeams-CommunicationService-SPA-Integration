const path = require('path');

module.exports = {
  mode: 'development', // or 'production' for production mode
  entry: './client/app.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    publicPath: '/' // Necessary for correct resolution of static assets
  },
  devtool: 'inline-source-map', // Optional: generate source maps for easier debugging
  devServer: {
    hot: true, // Enable hot module replacement (HMR)
    port: 3000 // Specify the port to use
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets' // Output folder for images
            }
          }
        ]
      }
    ]
  }
};
