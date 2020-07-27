const Compiler = require('../compiler');

function ServeCompiler(options) {
  this.vm = new Compiler(options);
}

module.exports = ServeCompiler;
