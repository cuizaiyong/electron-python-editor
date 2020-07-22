const { ipcMain } = require('electron');
exports.exec = function (vm) {
  ipcMain.on('run', async (event, code) => {
    const result = await vm.$exec(code);
    if (result.type === 'error') {
      event.sender.send('run_error', result.content);
    } else {
      event.sender.send('run_result', result.content);
    }
  })
}