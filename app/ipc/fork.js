const path = require('path');
const compilerPath = resolve('../compiler/platform/server.js');
const constantsPath = resolve('./constants.js');
const helperPath = resolve('./helper.js');
const Compiler = require(compilerPath);
const { INIT_COMPILER_SCRIPT, PYGAME_MODULE, STATUS } = require(constantsPath);
const { isExistRuntime } = require(helperPath);

async function main() {
  try {
    const { vm } = new Compiler({
      beforeCompile() {
        console.log('before compile');
      },
      compiled() {
        console.log('compiled');
      },
    });
    if (isExistRuntime(vm)) {
      send({ status: STATUS.success, msg: true });
      exit(0);
    }
    await vm.$compile();
    const result = await vm.$install(PYGAME_MODULE);
    if (process.env.NODE_ENV !== 'production') {
      send({ type: 'install pygame', result });
    }
    await vm.$exec(INIT_COMPILER_SCRIPT);
    if (process.env.NODE_ENV !== 'production') {
      send({ type: 'cold start' });
    }

    send({ status: STATUS.success, msg: 'success' });
    exit(0);
  } catch (e) {
    send({ status: STATUS.error, msg: String(e) });
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
  send({ status: STATUS.error, msg: String(e) });
  exit(0);
});

process.on('unhandledRejection', (e) => {
  send({ status: STATUS.error, msg: String(e) });
  exit(0);
});
main();
