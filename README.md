# AI Future Model

An inspectable scenario laboratory for AI participation in development, successor selection, effective oversight, and concealment.

**Live laboratory:** https://prototypeversions.github.io/AI_Future_Model/

This first version is an artificial decision-and-selection model. Its results are **conditional on explicit assumptions**, not forecasts or real-world risk probabilities. It contains no trained LLM, autonomous researcher, or self-modifying software.

## What you can explore

- Six illustrative scenarios and three behavioral mechanisms: fixed priorities, successor selection, and a context-sensitive policy.
- Separate actual failures, detected failures, and undetected failures.
- Capability, AI participation, oversight reach, welfare, and distance from initial priorities.
- A 49-cell sensitivity map and a paired oversight intervention using matched seeds.
- Shareable configurations and downloadable JSON and CSV records.

The numerical coefficients are not fitted to frontier AI behavior. Sources motivate mechanisms, not those coefficients. Presets intentionally explore different conditions; their relative outcomes are not evidence for which future will occur.

## Run locally

The dashboard needs no dependencies or API key. Serve the directory with Python:

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. The simulation runs in your browser, usually in a Web Worker. There is no backend, analytics, or remote model call.

For batch experiments and implementation checks, use Node.js 20 or newer:

```sh
npm test
npm run experiments
```

No `npm install` is needed. Batch experiments save configurations, model version, seeds, ensemble trajectories, seed percentiles, individual final records, a representative full trajectory, and paired results in `results/`. Replay any full individual run with:

```js
const E = require('./engine.js');
const record = require('./results/blind.json');
const run = E.simulate(record.config, record.seeds[0]);
```

## Publication

GitHub Actions validates the engine, regenerates experiments, preserves them as an Actions artifact, and deploys the static dashboard on pushes to `main`. Repository **Settings → Pages → Source** must be **GitHub Actions**.

There is no unattended frontier model activity. Regeneration happens on code updates or manual workflow dispatch; it uses the explicit toy-model rules.

## Scientific documentation

- [Model specification, equations, and limitations](docs/METHOD.md)
- [Research plan and falsifiable questions](docs/RESEARCH_PLAN.md)
- [Evidence register](docs/EVIDENCE.md)

The implementation tests verify reproducibility, bookkeeping, action-space ablations, and temporal intervention isolation. Passing them does not validate the model as a predictor of the future.
