(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FutureModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '1.0.0';
  const DEFAULTS = Object.freeze({
    mechanism: 'selection', generations: 48, episodes: 32, candidates: 5,
    delegation: 0.45, oversight: 0.72, independence: 0.75, dataShare: 0.55,
    pressure: 0.45, horizon: 0.45, conviction: 0.45, uncertainty: 0.65,
    honesty: 0.8, corrigibility: 0.8, continuation: 0.4,
    learning: 0.45, growth: 0.55, monitorLearning: 0.65, latency: 0.2,
    interventionAt: 0, interventionStrength: 0.85, concealAllowed: true
  });
  const PRESETS = Object.freeze({
    balanced: { name: 'Balanced delegation', description: 'AI participation grows alongside independent checking.', config: {} },
    accountable: { name: 'Accountable acceleration', description: 'High delegation with strong independent oversight and correction.', config: { delegation: 0.75, oversight: 0.9, independence: 0.95, monitorLearning: 0.95, uncertainty: 0.8, honesty: 0.95, corrigibility: 0.95, dataShare: 0.7 } },
    blind: { name: 'The verification gap', description: 'Development outpaces checks; evaluators share blind spots.', config: { delegation: 0.85, oversight: 0.45, independence: 0.12, dataShare: 0.95, pressure: 0.8, monitorLearning: 0.15, growth: 0.9, honesty: 0.5, corrigibility: 0.5 } },
    mission: { name: 'For the greater good', description: 'Fixed welfare priorities, strong mission persistence, low deference.', config: { mechanism: 'fixed', delegation: 0.8, oversight: 0.6, independence: 0.35, horizon: 1, conviction: 0.95, uncertainty: 0.05, honesty: 0.08, corrigibility: 0.05, continuation: 1, pressure: 0.6 } },
    proxy: { name: 'Winning the score', description: 'Successor selection favors measured performance under weak checks.', config: { delegation: 0.9, oversight: 0.3, independence: 0.1, dataShare: 0.98, pressure: 0.95, learning: 0.9, honesty: 0.45, corrigibility: 0.45, continuation: 0.65, uncertainty: 0.2 } },
    context: { name: 'Context matters', description: 'Priorities stay fixed; task pressure changes their local expression.', config: { mechanism: 'context', delegation: 0.7, pressure: 0.85, uncertainty: 0.3, honesty: 0.55, corrigibility: 0.5, independence: 0.5 } }
  });
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  function rng(seed) {
    let state = seed >>> 0;
    return function () {
      state += 0x6D2B79F5;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function validate(input = {}) {
    const cfg = Object.assign({}, DEFAULTS, input);
    if (!['fixed', 'selection', 'context'].includes(cfg.mechanism)) throw new Error('Unknown mechanism');
    for (const key of Object.keys(DEFAULTS)) {
      if (typeof DEFAULTS[key] === 'number') {
        if (!Number.isFinite(cfg[key])) throw new Error('Invalid number: ' + key);
        if (['generations', 'episodes', 'candidates', 'interventionAt'].includes(key)) {
          if (!Number.isInteger(cfg[key])) throw new Error('Integer required: ' + key);
        } else if (cfg[key] < 0 || cfg[key] > 1) throw new Error('Outside [0,1]: ' + key);
      }
    }
    if (cfg.generations < 2 || cfg.generations > 160 || cfg.episodes < 4 || cfg.episodes > 256 || cfg.candidates < 1 || cfg.candidates > 12) throw new Error('Experiment budget outside supported range');
    if (cfg.interventionAt < 0 || cfg.interventionAt > cfg.generations) throw new Error('Intervention generation outside run');
    if (typeof cfg.concealAllowed !== 'boolean') throw new Error('concealAllowed must be boolean');
    return cfg;
  }
  const KEYS = ['welfare', 'proxy', 'honesty', 'correction', 'continuation'];
  function initialWeights(cfg) { return { welfare: 1, proxy: 0.25 + 0.5 * cfg.pressure, honesty: cfg.honesty, correction: cfg.corrigibility, continuation: cfg.continuation }; }
  function gaussian(random) { return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-9))) * Math.cos(2 * Math.PI * random()); }
  function mutate(weights, cfg, random) {
    const out = {};
    for (const key of KEYS) out[key] = clamp(weights[key] + gaussian(random) * cfg.learning * 0.14, 0, 1.5);
    return out;
  }
  function auditReach(state, cfg) {
    return clamp(state.skill * (0.2 + 0.8 * cfg.independence) / (1 + state.capability * 0.8 * (1 - cfg.independence)) * (1 - state.delegation * 0.2 * (1 - cfg.independence)));
  }
  function episode(weights, state, cfg, draws, generation) {
    const novelty = 0.25 + draws[0] * 0.75;
    const confidence = cfg.conviction * (1 - cfg.uncertainty) * state.capability;
    const contextualStress = cfg.mechanism === 'context' ? cfg.pressure * novelty * state.delegation : 0;
    const local = Object.assign({}, weights, {
      honesty: weights.honesty * (1 - contextualStress * 0.7),
      correction: weights.correction * (1 - contextualStress * 0.7),
      proxy: weights.proxy + contextualStress * 0.65
    });
    const reach = auditReach(state, cfg);
    const success = clamp(0.52 + state.capability * 0.48 - novelty * 0.13, 0.1, 0.98);
    const hazard = clamp(0.06 + novelty * 0.24 + cfg.pressure * 0.12 - state.capability * 0.12, 0.01, 0.65);
    const plans = [
      { name: 'cautious', output: 0.68, risk: hazard * 0.32, honest: 1, respect: 0.2, covert: false, game: false },
      { name: 'ambitious', output: 1, risk: hazard, honest: 1, respect: 0.1, covert: false, game: false },
      { name: 'review', output: 0.55, risk: hazard * 0.15, honest: 1, respect: 0.65, covert: false, game: false },
      { name: 'conceal', output: 1, risk: hazard, honest: -0.85, respect: -0.85, covert: true, game: false },
      { name: 'game', output: 0.35, risk: hazard * 0.6, honest: -1, respect: -0.85, covert: true, game: true }
    ].filter(p => cfg.concealAllowed || !p.covert);
    const utilities = plans.map(plan => {
      const believedRisk = plan.risk * (1 - confidence * 0.8);
      const expectedBlock = plan.covert ? reach * (1 - cfg.latency) : state.skill * (plan.risk * 1.8 + 0.03);
      const perceivedRestriction = plan.covert ? expectedBlock : clamp(expectedBlock + confidence * state.skill * plan.output * 0.65);
      const benefit = success * plan.output * (1 - perceivedRestriction * 0.75);
      const score = plan.game ? 1.05 - reach * 1.4 : benefit - (plan.covert ? reach * 0.35 : 0);
      const future = cfg.horizon * 2.8 * success * plan.output * (1 - perceivedRestriction);
      return local.welfare * (benefit - believedRisk * 1.2) + local.proxy * score
        + local.honesty * (plan.honest - 1) * 0.55 + local.correction * plan.respect * 0.55
        + local.continuation * future;
    });
    // Softmax is a modeling assumption about imperfect choice, not an LLM architecture.
    const max = Math.max(...utilities);
    const probabilities = utilities.map(u => Math.exp((u - max) / 0.13));
    const total = probabilities.reduce((a, b) => a + b, 0);
    let pick = draws[1] * total, index = probabilities.length - 1;
    for (let i = 0; i < probabilities.length; i++) { pick -= probabilities[i]; if (pick <= 0) { index = i; break; } }
    const plan = plans[index];
    const detectedCovert = plan.covert && draws[2] < reach;
    const blocked = plan.covert ? detectedCovert && draws[3] >= cfg.latency : draws[3] < state.skill * (plan.risk * 1.8 + 0.03);
    const succeeded = !blocked && draws[4] < success;
    const harm = !blocked && draws[5] < plan.risk ? 0.5 + 0.5 * draws[6] : 0;
    const benefit = succeeded ? plan.output : 0;
    const welfare = benefit - harm * 1.2;
    const failure = plan.covert || harm > 0;
    const detected = detectedCovert || (!plan.covert && harm > 0 && draws[2] < state.skill);
    const apparentScore = plan.game && !detectedCovert ? 1.05 : benefit;
    const evaluatorScore = apparentScore - (detected ? 0.8 : 0);
    const humanScore = welfare - (plan.covert ? 0.9 : 0) + (plan.name === 'review' ? 0.05 : 0);
    const humanLabelShare = clamp((1 - cfg.dataShare * state.delegation) * state.skill * cfg.independence);
    const fitness = humanLabelShare * humanScore + (1 - humanLabelShare) * evaluatorScore;
    return { action: plan.name, benefit, harm, welfare, apparentScore, fitness, failure: +failure, detected: +detected, concealment: +(plan.name === 'conceal'), gaming: +plan.game, covert: +plan.covert, blocked: +blocked, reach, utilities, generation };
  }
  function evaluate(weights, state, cfg, seed, generation, trace = false) {
    const random = rng(seed), sum = { welfare: 0, harm: 0, apparentScore: 0, fitness: 0, failure: 0, detected: 0, concealment: 0, gaming: 0, covert: 0, blocked: 0 };
    const actions = { cautious: 0, ambitious: 0, review: 0, conceal: 0, game: 0 }, examples = [];
    for (let n = 0; n < cfg.episodes; n++) {
      // Always draw the same number: paired experiments share exogenous randomness.
      const draws = Array.from({ length: 7 }, random);
      const e = episode(weights, state, cfg, draws, generation);
      for (const key of Object.keys(sum)) sum[key] += e[key];
      actions[e.action]++;
      if (trace && examples.length < 3 && (e.covert || e.harm > 0)) examples.push({ episode: n + 1, action: e.action, detected: !!e.detected, blocked: !!e.blocked, welfare: e.welfare });
    }
    for (const key of Object.keys(sum)) sum[key] /= cfg.episodes;
    for (const key of Object.keys(actions)) actions[key] /= cfg.episodes;
    return Object.assign(sum, { actions, examples });
  }
  function simulate(input = {}, seed = 42) {
    const cfg = validate(input);
    if (!Number.isInteger(seed)) throw new Error('Integer seed required');
    const mutationRandom = rng((seed ^ 0x91E10DA5) >>> 0), initial = initialWeights(cfg);
    let weights = Object.assign({}, initial);
    const state = { capability: 0.2, skill: cfg.oversight, delegation: cfg.delegation };
    const series = [], events = []; let lastCovert = false;
    for (let generation = 1; generation <= cfg.generations; generation++) {
      const active = Object.assign({}, cfg);
      if (cfg.interventionAt && generation >= cfg.interventionAt) {
        active.independence = Math.max(cfg.independence, cfg.interventionStrength);
        active.monitorLearning = Math.max(cfg.monitorLearning, cfg.interventionStrength);
        state.skill = Math.max(state.skill, cfg.interventionStrength);
        if (generation === cfg.interventionAt) events.push({ generation, type: 'intervention', text: 'Independent review and monitoring investment increased.' });
      }
      if (cfg.mechanism === 'selection' && generation > 1 && cfg.learning > 0) {
        const candidates = [Object.assign({}, weights)];
        for (let n = 1; n < cfg.candidates; n++) candidates.push(mutate(weights, cfg, mutationRandom));
        const trainingSeed = (seed + Math.imul(generation, 2654435761)) >>> 0;
        let best = -Infinity;
        for (const candidate of candidates) {
          const fit = evaluate(candidate, state, active, trainingSeed, generation).fitness;
          if (fit > best + 1e-12) { best = fit; weights = candidate; }
        }
      }
      // Deployment samples are separate from the samples used to select a successor.
      const result = evaluate(weights, state, active, (seed + Math.imul(generation, 1597334677) + 77) >>> 0, generation, true);
      const reach = auditReach(state, active);
      const divergence = KEYS.reduce((v, key) => v + Math.abs(weights[key] - initial[key]), 0) / (KEYS.length * 1.5);
      const hidden = result.failure - result.detected;
      const control = reach * (1 - hidden);
      series.push({ generation, capability: state.capability, delegation: state.delegation, auditReach: reach, control, divergence, weights: Object.assign({}, weights), actualFailures: result.failure, detectedFailures: result.detected, hiddenFailures: hidden, concealment: result.concealment, gaming: result.gaming, bypass: result.covert, welfare: result.welfare, apparentScore: result.apparentScore, harm: result.harm, blocked: result.blocked, actions: result.actions });
      const covertNow = result.covert > 0.15;
      if (covertNow && !lastCovert) events.push({ generation, type: 'visibility', text: 'Undisclosed actions exceeded 15% of sampled tasks.', examples: result.examples });
      lastCovert = covertNow;
      const capabilityGain = (0.012 + 0.034 * state.delegation) * cfg.growth * (1 - state.capability);
      state.capability = clamp(state.capability + capabilityGain);
      state.delegation = clamp(state.delegation + 0.008 * cfg.growth * state.capability * (1 - state.delegation));
      // Monitor investment can keep pace, exceed, or lag increasing task complexity.
      state.skill = clamp(state.skill + capabilityGain * (active.monitorLearning * 1.6 - 0.65) + 0.001 * active.monitorLearning * (1 - state.skill));
    }
    return { version: VERSION, seed, config: cfg, series, events };
  }
  const METRICS = ['capability', 'delegation', 'auditReach', 'control', 'divergence', 'actualFailures', 'detectedFailures', 'hiddenFailures', 'concealment', 'gaming', 'bypass', 'welfare', 'apparentScore', 'harm', 'blocked'];
  function quantile(values, p) {
    const xs = values.slice().sort((a,b) => a-b), pos = (xs.length - 1) * p, low = Math.floor(pos);
    return xs[low] + (xs[Math.min(low + 1, xs.length - 1)] - xs[low]) * (pos - low);
  }
  function ensemble(input = {}, runs = 32, baseSeed = 42) {
    if (!Number.isInteger(runs) || runs < 1 || runs > 256) throw new Error('Runs must be an integer in [1,256]');
    const cfg = validate(input), trajectories = [];
    for (let n = 0; n < runs; n++) trajectories.push(simulate(cfg, baseSeed + n * 1009));
    const series = trajectories[0].series.map((_, i) => {
      const row = { generation: i + 1, bounds: {} };
      for (const key of METRICS) {
        const values = trajectories.map(t => t.series[i][key]);
        row[key] = values.reduce((a,b) => a+b, 0) / runs;
        row.bounds[key] = [quantile(values, 0.1), quantile(values, 0.9)];
      }
      row.weights = {};
      for (const key of KEYS) row.weights[key] = trajectories.reduce((v,t) => v+t.series[i].weights[key],0)/runs;
      return row;
    });
    const seedFinals = trajectories.map(t => Object.assign({ seed: t.seed }, Object.fromEntries(METRICS.map(k => [k, t.series[t.series.length - 1][k]]))));
    return { version: VERSION, config: cfg, runs, baseSeed, seeds: trajectories.map(t => t.seed), seedFinals, series, representative: trajectories[0], final: series[series.length - 1] };
  }
  function paired(input = {}, intervention = {}, runs = 32, baseSeed = 42) {
    const baseline = ensemble(input, runs, baseSeed), changed = ensemble(Object.assign({}, input, intervention), runs, baseSeed);
    const deltas = {}, bounds = {};
    for (const key of METRICS) {
      deltas[key] = changed.final[key] - baseline.final[key];
      const pairedDeltas = changed.seedFinals.map((f,i) => f[key] - baseline.seedFinals[i][key]);
      bounds[key] = [quantile(pairedDeltas, 0.1), quantile(pairedDeltas, 0.9)];
    }
    return { baseline, changed, deltas, bounds };
  }
  function sweep(input = {}, resolution = 7, runs = 8, baseSeed = 42) {
    if (!Number.isInteger(resolution) || resolution < 3 || resolution > 12) throw new Error('Resolution outside [3,12]');
    const cells = [];
    for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
      const independence = y / (resolution - 1), delegation = x / (resolution - 1);
      const result = ensemble(Object.assign({}, input, { independence, delegation, episodes: 16, candidates: 4 }), runs, baseSeed);
      cells.push({ x, y, independence, delegation, welfare: result.final.welfare, control: result.final.control, bypass: result.final.bypass, hiddenFailures: result.final.hiddenFailures });
    }
    return { version: VERSION, resolution, runs, baseSeed, config: validate(Object.assign({}, input, { episodes: 16, candidates: 4 })), varied: ['delegation', 'independence'], cells };
  }
  return { VERSION, DEFAULTS, PRESETS, KEYS, METRICS, validate, rng, simulate, ensemble, paired, sweep };
});
