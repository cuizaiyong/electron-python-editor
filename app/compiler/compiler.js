const fp = require('lodash/fp');
const {
  OPEN_SSL_URL,
  RUNTIME_URL,
  SETUP_DIST,
  PIP_MIRROR,
  WINDOW_RUNTIME_URL,
  STATUS,
} = require('./constants');
const cp = require('child_process');
const path = require('path');
function Compiler(options) {
  this.$options = options;
  this.$hooks = {};
  this._init();
}

Compiler.prototype._init = async function () {
  const vm = this;
  const target = this.constructor;
  vm.$dir = '.xigua';
  vm.$sslShellPath = path.join(__dirname, '../../scripts/ssl.sh');
  vm.$runtimeShellPath = path.join(__dirname, '../../scripts/runtime.sh');
  vm.$codesDir = path.join(__dirname, '../../codes');

  initGlobal(target);
  initEnv(vm, target);
  initHooks(vm);
  initCompile(vm);
  callhook(vm, 'beforeCompile');
  mixinCompile(target);

  mixinScriptAndModule(target);
};
function mixinScriptAndModule(target) {
  // install package
  target.prototype.$install = function (module) {
    const vm = this;
    const pip = cp.spawn(vm.$runtimePip, ['install', '-i', PIP_MIRROR, module]);
    return promisfy(pip);
  };
  target.prototype.$uninstall = function (module) {
    const vm = this;
    const pip = cp.spawn(vm.$runtimePip, ['uninstall', '-y', module]);
    return promisfy(pip);
  };
  // exec python code
  target.prototype.$exec = function (code) {
    console.log(code);
    const vm = this;
    const python = cp.spawn(vm.$runtimeBin, ['-c', code]);
    return promisfy(python);
  };
  // list installed modules
  target.prototype.$list = function () {
    const vm = this;
    const list = cp.spawn(vm.$runtimePip, ['freeze']);
    return promisfy(list);
  };
  function promisfy(cp) {
    return new Promise((resolve) => {
      let result = {
        status: STATUS.success,
        msg: '',
      };
      cp.stdout.on('data', (data) => {
        result.msg += data.toString();
      });

      cp.stderr.on('data', (data) => {
        (result.status = STATUS.error), (result.msg += data.toString());
        resolve(result);
      });

      cp.on('close', () => {
        resolve(result);
      });
    });
  }
}
function initCompile(vm) {
  const { $compileData } = vm;
  vm.$compileData = $compileData || {
    opensslUrl: OPEN_SSL_URL,
    runtimeUrl: RUNTIME_URL,
  };
  vm.$compileDir = vm.$home + '/' + vm.$dir;
  subUrlAsCompilePathName(vm);
  const {
    $compileDir,
    $compileData: {
      opensslName,
      runtimeName,
      opensslNameOrigin,
      runtimeNameOrigin,
    },
  } = vm;
  vm.$sslCompileDir = $compileDir + '/' + opensslName;
  vm.$runtimeCompileDir = $compileDir + '/' + runtimeName;
  vm.$sslCompileOriginDir = $compileDir + '/' + opensslNameOrigin;
  vm.$runtimeCompileOriginDir = $compileDir + '/' + runtimeNameOrigin;
  vm.$compiledDir = $compileDir + '/local';
  vm.$compiledRuntimeDir = vm.$compiledDir + '/runtime';
  if (vm.$system.type.includes('Windows')) {
    vm.$runtimeBin =
      vm.$home + '\\.xigua\\python-3.7.8-embed-amd64\\python.exe';
    vm.$runtimePip =
      vm.$home + '\\.xigua\\python-3.7.8-embed-amd64\\Scripts\\pip.exe';
  } else {
    vm.$runtimeBin = vm.$compiledRuntimeDir + '/bin/python3';
    vm.$runtimePip = vm.$compiledRuntimeDir + '/bin/pip3';
  }

  function subUrlAsCompilePathName(vm) {
    let { $compileData } = vm;
    const compose = fp.flowRight(fp.last, fp.split('/'));
    [
      { name: 'opensslName', url: 'opensslUrl' },
      { name: 'runtimeName', url: 'runtimeUrl' },
    ].reduce((acc, pre) => {
      acc[pre.name] = fp.flowRight(
        fp.replace(/\.(tar|gz|tgz)/g, ''),
        compose
      )(acc[pre.url]);
      acc[pre.name + 'Origin'] = compose(acc[pre.url]);
      return acc;
    }, $compileData);
  }
}
function mixinCompile(target) {
  target.prototype.$compile = async function () {
    const vm = this;

    await isExistDir(vm.$compileDir);
    if (vm.$system.type.includes('Windows')) {
      await target.download(WINDOW_RUNTIME_URL, vm.$compileDir);
      // target.fse.ensureDir(vm.$compileDir, vm.$home + '\\.xigua\\' + 'python-3.7.8-embed-amd64');
      depressTar(
        target,
        vm.$compileDir,
        vm.$home + '\\.xigua\\python-3.7.8-embed-amd64.tgz'
      );
      cp.execFileSync(vm.$runtimeBin, [
        vm.$home + '\\.xigua\\python-3.7.8-embed-amd64\\get-pip.py',
      ]);
    } else {
      await download(vm, target, vm.$compileDir);

      depressTar(target, vm.$compileDir, vm.$sslCompileOriginDir);
      depressTar(target, vm.$compileDir, vm.$runtimeCompileOriginDir);

      await compileSSl(vm, target);
    }
    callhook(vm, 'compiled');
  };
  async function compileSSl(vm) {
    const {
      $sslShellPath,
      $runtimeShellPath,
      $compiledDir,
      $sslCompileDir,
      $runtimeCompileDir,
      $compiledRuntimeDir,
    } = vm;
    await execFile($sslShellPath, [$sslCompileDir, $compiledDir]);
    fp.flowRight(
      writeFile,
      injectWholeSSLScript(
        /\#\s+start\s+placeHolder([\s\S]*)\#\s+end\s+placeHolder/g
      ),
      injectSSLPath(/<\%(.*)\%>/g, SETUP_DIST),
      readFileAndInitOptions
    )(target, $runtimeCompileDir + '/Modules/Setup.dist', $compiledDir);
    await execFile($runtimeShellPath, [
      $runtimeCompileDir,
      $compiledRuntimeDir,
    ]);
  }
  function writeFile(options) {
    if (options.finalContent) {
      options.target.fs.writeFileSync(
        options.filename,
        options.finalContent,
        'utf-8'
      );
    }
  }
  function injectWholeSSLScript(reg) {
    return (options) => {
      if (reg.test(options.content)) {
        const text = RegExp.$1;
        options.finalContent = fp.replace(
          text,
          options.replacedContent,
          options.content
        );
      }
      return options;
    };
  }
  function injectSSLPath(reg, content) {
    return (options) => {
      return Object.assign({}, options, {
        replacedContent: fp.replace(reg, options.path, content),
      });
    };
  }
  function readFileAndInitOptions(target, filename, path) {
    return {
      path,
      target,
      filename,
      content: target.fs.readFileSync(filename, 'utf-8'),
    };
  }
  function execFile(file, args) {
    cp.execFileSync(file, args, {
      stdio: 'inherit',
    });
  }
  async function download(vm, target, dir) {
    const { $compileData } = vm;
    await target.download($compileData.opensslUrl, dir);
    await target.download($compileData.runtimeUrl, dir);
  }
  async function isExistDir(dir) {
    await target.fse.ensureDir(dir);
  }
  function depressTar(target, cwd, file) {
    return target.tar.x({
      cwd,
      file,
      sync: true,
    });
  }
}
function initHooks(vm) {
  const { $options } = vm;
  ['beforeCompile', 'compiled'].forEach((hook) => {
    if ($options[hook] && fp.isFunction($options[hook])) {
      vm.$hooks[hook] = [$options[hook].bind(vm)];
    }
  });
}
function initEnv(vm, target) {
  const { osenv, os } = target;
  Object.keys(osenv).forEach((key) => {
    vm['$' + key] = osenv[key]();
  });
  vm.$system = {
    arch: os.arch(),
    type: os.type(),
  };
}
function callhook(vm, hook) {
  const cbs = vm.$hooks[hook];
  cbs.forEach((cb) => {
    cb();
  });
}
function initGlobal(target) {
  target.tar = require('tar');
  target.fse = require('fs-extra');
  target.fs = require('fs');
  target.os = require('os');
  target.osenv = require('osenv');
  target.download = require('download');
}

module.exports = Compiler;
