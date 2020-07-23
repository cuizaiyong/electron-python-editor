const { ipcMain } = require('electron');
const UNINSTALL_EVENT = 'uninstall';
const UNINSTALL_EVENT_RESPOND = 'uninstallResult';
exports.uninstall = (vm) => {
  ipcMain.on(UNINSTALL_EVENT, async (event, module) => {
    const result = await vm.$uninstall(module);
    console.log(result);
    event.sender.send(UNINSTALL_EVENT_RESPOND, result);
  })
}