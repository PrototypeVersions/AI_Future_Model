importScripts('engine.js');
self.onmessage = function (event) {
  const { id, kind, config, runs, seed, intervention } = event.data;
  try {
    let result;
    if (kind === 'sweep') result = FutureModel.sweep(config, 7, 8, seed);
    else if (kind === 'paired') result = FutureModel.paired(config, intervention, runs, seed);
    else result = FutureModel.ensemble(config, runs, seed);
    self.postMessage({ id, kind, result });
  } catch (error) { self.postMessage({ id, kind, error: error.message }); }
};
