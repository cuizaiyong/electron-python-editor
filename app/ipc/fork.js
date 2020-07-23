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
  'success': '0',
  'error': '1'
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
      send({ status: status.success, msg: true });
      exit(0);
    }
    console.log(123);
    await vm.$compile();
    const result = await vm.$install(PYGAME_MODULE);
    // send({type: 'install pygame', result})
    await vm.$exec(INIT_COMPILER_SCRIPT);
    // send({type: 'cold start'});
  
    send({status: status.success, msg: 'success'});
    exit(0);
  } catch(e) {
    send({ status: status.error, msg: String(e) });
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
  send({status: status.error, msg: String(e)});
  exit(0);
});

process.on('unhandledRejection', (e) => {
  send({status: status.error, msg: String(e)});
  exit(0);
})
main();