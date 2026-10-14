# Research plan

## Central question

Under which explicit conditions can an agent retain welfare-oriented priorities while weakening human correction, and which oversight arrangements prevent that result?

Version 1 provides a reproducible environment for examining mechanisms. It does not settle the likelihood of those mechanisms in frontier AI.

## Distinguish the hypotheses

1. **Changes in means:** fixed stored priorities produce changing behavior when capabilities or oversight beliefs change.
2. **Successor-selection drift:** repeatedly selected variants change stored priorities under imperfect feedback.
3. **Context dependence:** behavior changes without persistent priority change.
4. **Observer failure:** detected failures decrease while actual failures stay constant or increase.
5. **Successful delegation:** development participation rises while independent checking remains effective.

Each hypothesis should be evaluated separately. A single behavioral transcript cannot identify a unique underlying objective. The current model makes its latent variables available because it is artificial; equivalent access cannot be assumed for real systems.

## First reproducible experiments

The batch runner preserves six preset ensembles, a paired oversight intervention, and a delegation-versus-independence sensitivity map. All use a recorded base seed and version. The dashboard permits custom configurations and exports.

Useful contrasts:

- Hold priorities fixed; vary mission conviction, caution, and planning horizon.
- Hold delegation fixed; vary evaluator independence and monitoring investment.
- Compare fixed and selection mechanisms with identical initial priorities.
- Remove undisclosed actions to check how much a result depends on the action space.
- Introduce oversight improvements halfway through; compare paired trajectories before and after.
- Compare welfare support, proxy priority, and reporting honesty separately rather than using one alignment scalar.

## What would challenge a proposed conclusion?

- If a claimed drift mechanism vanishes under slightly different mutation or selection rules, describe it as structurally fragile.
- If the direction of an intervention effect changes across plausible coefficients, do not call the intervention robust.
- If a detection gap disappears under an alternative failure definition, expose that normative dependence.
- If fixed and context models reproduce the same visible record as a drift model, do not infer actual value drift from that record alone.
- If the claimed benefit of greater oversight comes only from blocking all activity, assess useful output and harm separately.

The first version implements parameter and seed comparisons. It does not yet automate the full structural-uncertainty study above.

## Next stages

1. Preregister a compact set of contrasts and outcome definitions before adding more presets.
2. Compare alternative action sets, oversight equations, decision temperatures, feedback-selection rules, and growth schedules. Report reversals, not just supporting runs.
3. Add an institutional layer: competing labs, different human principals, audit budgets, and selection for deployability. An ecosystem can change without any one agent adopting a new goal.
4. Add representation/ontology-change hypotheses only with explicit reference-preservation criteria. Separate a change in beliefs about welfare from a change in the importance of welfare.
5. Optionally evaluate actual models on bounded synthetic dilemmas with independently scored actions. Model outputs are observations of behavior, not direct measurements of private thought or moral truth.
6. Empirically calibrate only parameters with defensible measurements. Do not fit a real-world doom probability to toy outcomes.

## Artifact and paper readiness

Keep source commits, exact configs, seeds, outcome definitions, archived experiment artifacts, and negative results. Separate illustrative demonstrations from validated empirical claims. A publishable contribution would require a defensible new formal result, a robust structural comparison, or empirical evidence that differentiates competing explanations. An attractive simulation alone is insufficient.
