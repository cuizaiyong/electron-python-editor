const Compiler = require('../compiler');
const { initIpc } = require('../../ipc');
function WebCompiler(options) {
  this.vm = new Compiler(options);
  initIpc(this.vm);
}

module.exports = WebCompiler;
