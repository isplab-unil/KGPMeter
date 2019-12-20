const path = require("path");

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, "app/src/js/app.js"),//"./app/src/js/app.js",
  output: {
    path: path.resolve(__dirname, "app/js"),
    filename: "kgpmeter_bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["babel-preset-env"]
          }
        }
      }
    ]
  }
};