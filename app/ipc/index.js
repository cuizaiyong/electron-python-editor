const path = require('path');
const { exec } = require('./exec');
const { install } = require('./install');
const { list } = require('./list');
const { uninstall } = require('./uninstall');
const { ipcMain } = require('electron');
const {
  INIT_EVENT,
  INIT_EVENT_RESPOND,
  CHECK,
  CHECK_RESULT,
  RUN_PYGAME_DEMO,
  PYGAME_CODE_DEMO,
  STATUS,
} = require('./constants');
const cp = require('child_process');
const { isExistRuntime } = require('./helper');
exports.initIpc = (vm) => {
  exec(vm);
  list(vm);
  install(vm);
  uninstall(vm);
  initialCompiler();
  check(vm);
  runPygameDemo(vm);
};

function initialCompiler() {
  ipcMain.on(INIT_EVENT, async (event) => {
    const forkProcess = cp.fork(path.join(__dirname, 'fork.js'), [], {
      stdio: 'inherit',
    });

    forkProcess &&
      forkProcess.on('message', (type) => {
        event.sender.send(INIT_EVENT_RESPOND, type);
      });
  });
}

function check(vm) {
  // @todo cache
  ipcMain.on(CHECK, (event) => {
    const isExist = isExistRuntime(vm);
    event.sender.send(CHECK_RESULT, { status: STATUS.success, msg: isExist });
  });
}

function runPygameDemo(vm) {
  ipcMain.on(RUN_PYGAME_DEMO, async (event) => {
    const result = await vm.$exec(PYGAME_CODE_DEMO);
    event.sender.send(`${RUN_PYGAME_DEMO}Result`, {
      status: STATUS.success,
      msg: result.content,
    });
  });
}
