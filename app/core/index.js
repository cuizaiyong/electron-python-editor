const { app, BrowserWindow } = require('electron');
const Compiler = require('../compiler/platform/web');
function createWindow() {
  let win = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
    }
  })

  // win.loadFile('index.html');
  win.loadURL('https://zhishi.oss-cn-beijing.aliyuncs.com/electron-python/index.html');

  win.webContents.openDevTools()
}

app.whenReady().then(createWindow).then(() => {
  new Compiler({
    beforeCompile() {},
    compiled() {}
  });
});