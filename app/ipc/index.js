const path = require('path');
const { exec } = require('./exec');
const { install } = require('./install');
const { ipcMain } = require('electron');
const { INIT_EVENT, INIT_EVENT_RESPOND, CHECK, CHECK_RESULT, RUN_PYGAME_DEMO, PYGAME_CODE_DEMO } = require('./constants');
const cp = require('child_process');
const { isExistRuntime }  = require('./helper')
exports.initIpc = (vm) => {
  exec(vm);
  install(vm);
  initialCompiler();
  check(vm);
  runPygameDemo(vm);
}

function initialCompiler() {
  ipcMain.on(INIT_EVENT, async (event) => {
    
    const forkProcess = cp.fork(path.join(__dirname, 'fork.js'), [], {
      stdio: 'inherit'
    });
 
    forkProcess && forkProcess.on('message', type => {
      event.sender.send(INIT_EVENT_RESPOND, type);
    });
  })
}

function check(vm){
  // @todo cache
  ipcMain.on(CHECK, (event) => {
    const isExist = isExistRuntime(vm);
    event.sender.send(CHECK_RESULT, isExist);
  })
}

function runPygameDemo(vm) {
  ipcMain.on(RUN_PYGAME_DEMO, async (event) => {
    const result = await vm.$exec(PYGAME_CODE_DEMO);
    if (result.type === 'error') {
      event.sender.send('run_error', result.content);
    } else {
      event.sender.send('run_result', result.content);
    }
  })
}

