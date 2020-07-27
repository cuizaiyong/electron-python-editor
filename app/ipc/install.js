const { ipcMain } = require('electron');
const INSTALL_EVENT = 'install';
const INSTALL_EVENT_RESPOND = 'installResult';
exports.install = (vm) => {
  ipcMain.on(INSTALL_EVENT, async (event, module) => {
    const result = await vm.$install(module);
    event.sender.send(INSTALL_EVENT_RESPOND, result);
  });
};
