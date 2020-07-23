const { ipcMain } = require('electron');
const EXEC_EVENT = 'run';
const EXEC_EVENT_RESPOND = 'runResult';
exports.exec = function (vm) {
  ipcMain.on(EXEC_EVENT, async (event, code) => {
    const result = await vm.$exec(code);
    event.sender.send(EXEC_EVENT_RESPOND, result);
  })
}