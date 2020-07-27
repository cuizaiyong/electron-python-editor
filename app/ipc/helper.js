exports.isExistRuntime = function (vm) {
  const target = vm.constructor;
  const { $runtimeBin } = vm;
  return target.fs.existsSync($runtimeBin);
};
