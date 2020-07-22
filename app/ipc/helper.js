exports.isExistRuntime = function (vm) {
  const target = vm.constructor;
  const { $runtimeBin } = vm;
  console.log($runtimeBin);
  return target.fs.existsSync($runtimeBin)
}