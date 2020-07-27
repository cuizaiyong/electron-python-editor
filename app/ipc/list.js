const { ipcMain } = require('electron');
const LIST_EVENT = 'list';
const LIST_EVENT_RESPOND = 'listResult';
const fp = require('lodash/fp');
const { STATUS } = require('./constants');
class Module {
  constructor(name, description, img, alias, installed) {
    this.hover = false;
    this.shouldDisplayInstall = false;
    this.progress = 0;
    this.name = name;
    this.description = description;
    this.img = img;
    this.alias = alias;
    this.installed = installed;
  }
}
const pygame = new Module(
  'Pygame',
  'Pygame是用于开发2D游戏的Python库，也是最受欢迎的Python库之一。学会使用Pygame库，我们能够做出各种好玩有趣的游戏及互动程序。',
  'https://m.xiguacity.cn/electron-python/client/pygame.png',
  'pygame==2.0.0.dev6',
  false
);
const requests = new Module(
  'Requests',
  'Requests库可以用来发送请求、处理响应结果；学会Requests库，我们能轻易调用网络api接口，实现爬虫、翻译、智能机器人等各种有趣的效果。',
  'https://m.xiguacity.cn/electron-python/client/requests.jpg',
  'requests',
  false
);
exports.list = (vm) => {
  ipcMain.on(LIST_EVENT, async (event) => {
    const result = await vm.$list();
    if (result.status !== STATUS.success) {
      event.sender.send(LIST_EVENT_RESPOND, result);
    } else {
      const moduleInfo = fp.lowerCase(result.msg);
      event.sender.send(LIST_EVENT_RESPOND, {
        status: STATUS.success,
        msg: [pygame, requests].map((module) => {
          const moduleName = fp.toLower(module.name);
          if (fp.includes(moduleName, moduleInfo)) {
            module.installed = true;
          } else {
            module.installed = false;
          }
          return module;
        }),
      });
    }
  });
};
