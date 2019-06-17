const path = require('path')

module.exports = {
  entry: './lib/server/htmlServerMain',
  target: 'node',
  mode: 'none',
  output: {
    path: path.resolve(__dirname, '.release/lib/server'),
    filename: 'htmlServerMain.js'
  },
  plugins: [
  ],
  node: {
    __filename: false,
    __dirname: false
  },
  externals: {
    'typescript': 'commonjs typescript'
  }
}
