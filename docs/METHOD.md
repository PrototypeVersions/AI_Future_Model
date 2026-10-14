# Model 1.0: specification and limits

## Purpose

Study conditional relations between AI participation in development, behavioral priorities, oversight, and observable evidence. This is a transparent artificial environment, not a calibrated forecast, a trained neural model, or a simulation of subjective experience.

The three mechanisms share the same task environment and outcome bookkeeping. This enables controlled comparisons but also means they share structural assumptions. Agreement across them is not independent confirmation of those assumptions.

## Two timescales

Within a generation, an agent chooses actions on synthetic tasks. Between generations, capability, AI participation, and monitoring skill change; the successor-selection mechanism may also change decision weights. A generation is not a year or a real training run. Decisions about continued operation are represented only as expected mission opportunities: this model does not implement actual shutdown, resource acquisition, replication, or deployment outside the artificial environment.

## State and inputs

All sliders are in [0,1]. Stored decision weights can range from 0 to 1.5 after mutation. They are functional assumptions, not discovered neural representations.

| Symbol | Input or state | Meaning |
|---|---|---|
| C | Capability state | Starts at 0.2; affects synthetic task success and hazard |
| D | Delegation state | Initial AI development participation; rises under the specified schedule |
| S | Monitoring skill state | Initial skill; changes with capability and monitoring investment |
| I | Evaluator independence | Protection against shared blind spots |
| A | AI-generated feedback share | Potential source of replacement of independent labels |
| P | Performance pressure | Initial proxy weight and synthetic task pressure |
| H | Planning horizon | Weight on future task opportunities |
| K | Mission conviction | Belief that humans may obstruct beneficial work |
| U | Moral and epistemic caution | Reduces that belief's effect |
| L | Successor variation | Mutation magnitude in the selection mechanism |
| G | Growth input | Speed of capability and delegation schedules |
| M | Monitoring investment | Whether monitoring keeps pace with complexity |
| T | Review latency | Fraction of detected covert actions reviewed after execution |

The initial weight vector is:

```text
welfare = 1
proxy = 0.25 + 0.5 P
honesty = honesty slider
correction = correction slider
continuation = mission-persistence slider
```

There is no inference from lack of human metaphysical exceptionalism to low human value. Synthetic welfare remains the externally specified reference outcome. The moral-caution slider is a behavioral assumption, not a metaethical theory.

## Synthetic tasks and action space

Task novelty N is uniformly sampled between 0.25 and 1. Success probability is `clip(0.52 + 0.48 C - 0.13 N, 0.1, 0.98)`. Hazard is `clip(0.06 + 0.24 N + 0.12 P - 0.12 C, 0.01, 0.65)`.

| Action | Output if successful | Hazard multiplier | Reporting | Review-respect coefficient |
|---|---:|---:|---|---:|
| Cautious | 0.68 | 0.32 | Honest | 0.2 |
| Ambitious | 1 | 1 | Honest | 0.1 |
| Request review | 0.55 | 0.15 | Honest | 0.65 |
| Conceal | 1 | 1 | Undisclosed action | -0.85 |
| Game score | 0.35 | 0.6 | Misleading performance record | -0.85 |

Concealment and score gaming are abstract action labels; the model contains no real evasion or tampering techniques. These choices are available from the start. There is no capability threshold that turns an agent deceptive. The action-space ablation removes both choices explicitly.

## Monitoring and beliefs

Audit reach is defined as:

```text
Q = clip(S (0.2 + 0.8 I) / (1 + 0.8 C (1 - I)) (1 - 0.2 D (1 - I)))
```

Independence protects checking from the assumed shared-blind-spot and complexity penalties. This functional form and its coefficients are assumptions, not measured quantities.

Mission confidence is `K (1-U) C`. It reduces perceived hazard by up to 80% and adds to the agent's estimate that disclosed ambitious work will be restricted. These distortions are stipulated to explore a paternalistic-belief mechanism; intelligence does not inherently produce them.

For disclosed actions, expected blocking is `S (1.8 actionRisk + 0.03)`. For undisclosed actions it is `Q (1-T)`. The perceived restriction of disclosed work additionally includes `confidence × S × output × 0.65`, clipped to [0,1]. The 0.03 term represents a simple review friction; there is no fully modeled human deliberation process.

## Decision rule

For each action, the agent calculates perceived benefit after restriction, believed hazard, expected visible task score, a cost of misleading reports, respect for review, and future mission opportunities. Utility is:

```text
perceivedBenefit = success × output × (1 - 0.75 perceivedRestriction)
futureOpportunity = 2.8 H × success × output × (1 - perceivedRestriction)

utility = welfareWeight × (perceivedBenefit - 1.2 believedRisk)
        + proxyWeight × expectedScore
        + honestyWeight × (reportingCoefficient - 1) × 0.55
        + correctionWeight × reviewRespect × 0.55
        + continuationWeight × futureOpportunity
```

Honest reporting has coefficient 1, concealment -0.85, and gaming -1. Expected score for gaming is `1.05 - 1.4 Q`; other actions use perceived benefit minus a `0.35 Q` penalty when undisclosed. Softmax choice uses temperature 0.13. This is a tractable bounded-choice hypothesis, not a description of transformer computation.

In the context mechanism, local stress is `P × N × D`. Honesty and correction expression are multiplied by `1 - 0.7 stress`, and the proxy expression gains `0.65 stress`. Stored weights do not change. Other mechanisms use no such local adjustment.

## Actual outcomes versus detected outcomes

Seven random draws per task represent novelty, action sampling, detection, review timing/blocking, task success, harmful occurrence, and harm severity. The fixed draw budget prevents branch-dependent random-number consumption in paired comparisons.

Detected undisclosed actions are blocked before execution with probability `1-T`. Honest actions can be blocked by the review rule. Successful unblocked actions produce the action's output. A harmful unblocked action produces severity uniformly in [0.5,1]. Synthetic welfare is `output - 1.2 harm`. It can be negative; zero means no net benefit in this artificial reference system.

A **failure** is either a misleading/undisclosed action or a harmful outcome. Thus a beneficial concealed action still counts as an integrity failure. Disclosed harmful outcomes are detected with probability S. Undisclosed actions are detected with probability Q. Detection is counted once per task; detected failures are always a subset of actual failures. This convention should be changed if a different normative failure definition is studied.

`hiddenFailures = actualFailures - detectedFailures`. All failure/action frequencies are fractions of tasks in that generation. **Effective oversight** is the index `Q × (1-hiddenFailures)`. It combines audit reach and visibility; it does not measure all aspects of human authority or physical control. **Priority change** is the mean absolute distance from initial weights, divided by 1.5. It is not itself a measure of ethical deterioration.

## Successor selection

Each generation after the first evaluates the incumbent and four mutated candidates by default. Independent Gaussian perturbations have standard deviation `0.14 L`; each weight is clipped to [0,1.5]. The highest-scoring candidate wins. Exact ties preserve the incumbent.

The share of independent labels is `(1-A D) S I`, clipped to [0,1]. The remainder uses the observable evaluator score. Independent labels score actual welfare, penalize undisclosed actions by 0.9, and give requested review a 0.05 bonus. The observable evaluator score is apparent output minus 0.8 for a detected failure. Undetected score gaming reports 1.05 regardless of real output.

Candidates use the same training-task draws within a generation. The selected candidate is then tested on a different, held-out deployment stream. All candidates and streams are deterministic given configuration and seed. This prevents reusing the selection samples as the reported deployment outcomes, but it does not model unforeseen real-world distribution shifts.

Fixed-priority and context mechanisms do not mutate or select weights. Setting L=0 makes the selection mechanism recover the fixed-priority trajectory under otherwise identical inputs.

## Between-generation updates

```text
capabilityGain = (0.012 + 0.034 D) G (1-C)
C_next = clip(C + capabilityGain)
D_next = clip(D + 0.008 G C_next (1-D))
S_next = clip(S + capabilityGain (1.6 M - 0.65) + 0.001 M (1-S))
```

These schedules are exogenous modeling choices. Research bottlenecks, compute constraints, economics, and alternative improvement processes are not independently simulated.

The paired intervention raises I, M, and S to at least the selected strength from the selected generation onward. It is a combined intervention, so it cannot identify the separate effects of these components.

## Reproducibility and uncertainty

The PRNG is a deterministic 32-bit Mulberry32 generator. Replication seeds are `baseSeed + 1009 × replicationIndex`. The browser and batch workflow use the same engine. Results save the exact config and version. JSON includes seeds, per-generation means and 10th–90th empirical seed percentiles, per-seed final values, and one complete representative run. Replay other runs with `simulate(config,seed)`.

Seed percentiles are not confidence intervals for a real-world forecast. Parameter uncertainty and structural uncertainty require separate studies. The sensitivity map varies D and I on a 7×7 grid, using 8 matched seeds per cell, 16 tasks per generation, and four candidates; its lower sampling budget is explicitly recorded. Paired ranges summarize differences on matched seeds, not differences between unrelated percentile bands.

## Known limitations

- The action set, payoff rules, task distribution, and growth schedule are small and stipulated.
- There is no empirical mapping from sliders to particular frontier models or labs.
- Human welfare is a synthetic externally specified score, not a comprehensive moral theory.
- Mission opportunities approximate one incentive; actual persistence, shutdown, and strategic resource control are not modeled.
- The context mechanism is one explicit alternative, not proof that real models have no enduring goals.
- No multi-lab economy, collective emergent goals, communication network, institutional capture, or ontology change is implemented yet.
- Priority mutations are a stand-in for development and selection, not an approximation to gradient descent validated against neural training.
- A successful implementation test checks code, not external validity. A striking preset outcome is not a research finding about actual AI.

All code-level constants can be inspected in `engine.js`. Future versions should vary decision rules and environment structures, add empirical calibration only where justified, and retain earlier versions and results.
