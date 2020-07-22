const path = require('path');
const compilerPath = resolve('../compiler/platform/server.js');
const constantsPath = resolve('./constants.js')
const helperPath = resolve('./helper.js');
const Compiler = require(compilerPath);
const { 
  INIT_COMPILER_SCRIPT,
  PYGAME_MODULE
} = require(constantsPath);
const { isExistRuntime } = require(helperPath);
const status = {
  0: 'exist',
  1: 'success',
  2: 'fail'
}
async function main() {
  try {
    const { vm } = new Compiler({
      beforeCompile() {
        console.log('before compile');
      },
      compiled() {
        console.log('compiled');
      }
    });
    if (isExistRuntime(vm)) {
      send({ type: status[0] });
      exit(0);
    }
    await vm.$compile();
    const result = await vm.$install(PYGAME_MODULE);
    send({type: 'install pygame', result})
    await vm.$exec(INIT_COMPILER_SCRIPT);
    send({type: 'cold start'});
  
    send({type: status[1]});
    exit(0);
  } catch(e) {
    send({ type: status[2], info: String(e) });
  }
}

function send(content) {
  return process.send(content);
}

function exit(code) {
  return process.exit(code);
}
function resolve(filename) {
  return path.resolve(__dirname, filename);
}
process.on('uncaughtException', (e) => {
  send({type: status[2], info: String(e)});
  exit(0);
});

process.on('unhandledRejection', (e) => {
  send({type: status[2], info: String(e)});
  exit(0);
})
main();