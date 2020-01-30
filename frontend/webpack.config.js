const path = require("path");

module.exports = {
  mode: 'development',
  entry: {
    "app/js/kgpmeter_bundle.js": path.resolve(__dirname, "app/src/js/app.js"),//"./app/src/js/app.js",
    "lib/js/kgpmeter.js": path.resolve(__dirname, "lib/src/js/kgpmeter.js")
  },
  output: {
    path: path.resolve(__dirname,"."),
    filename: "[name]"
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