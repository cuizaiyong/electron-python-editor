const { ipcMain } = require('electron');

exports.install = (vm) => {
  ipcMain.on('pip', async (event, module) => {
    const result = await vm.$install(module);
    event.sender.send('pip_result', result);
  })
}