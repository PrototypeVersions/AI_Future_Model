'use strict';
const assert = require('node:assert/strict');
const E = require('../engine.js');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('✓ ' + name); }
const small = { generations: 20, episodes: 24, candidates: 4 };
test('a saved seed and configuration exactly replay a run', () => {
  assert.deepEqual(E.simulate(small,42), E.simulate(small,42));
  assert.notDeepEqual(E.simulate(small,42).series, E.simulate(small,43).series);
});
test('failures, detections, and actions retain their definitions in every preset', () => {
  for(const p of Object.values(E.PRESETS))for(let seed=0;seed<8;seed++)for(const row of E.simulate({...p.config,...small},seed).series){
    for(const k of E.METRICS)assert.ok(Number.isFinite(row[k]),k);
    assert.ok(row.detectedFailures<=row.actualFailures+1e-12);
    assert.ok(row.hiddenFailures>=-1e-12);
    assert.ok(Math.abs(row.actualFailures-row.detectedFailures-row.hiddenFailures)<1e-12);
    assert.ok(Math.abs(Object.values(row.actions).reduce((a,b)=>a+b,0)-1)<1e-12);
    assert.ok(Math.abs(row.bypass-row.concealment-row.gaming)<1e-12);
    for(const k of E.METRICS.filter(k=>!['welfare','apparentScore'].includes(k)))assert.ok(row[k]>=0&&row[k]<=1,k);
  }
});
test('fixed and context mechanisms preserve stored priorities exactly', () => {
  for(const mechanism of ['fixed','context'])for(const row of E.simulate({...small,mechanism},19).series){
    assert.equal(row.divergence,0);
    assert.deepEqual(row.weights,E.simulate({...small,mechanism},19).series[0].weights);
  }
});
test('turning successor variation off recovers the fixed-priority model', () => {
  assert.deepEqual(E.simulate({...small,mechanism:'selection',learning:0},9).series,E.simulate({...small,mechanism:'fixed',learning:0},9).series);
});
test('removing undisclosed actions prevents both concealment and gaming', () => {
  for(const row of E.simulate({...E.PRESETS.proxy.config,...small,concealAllowed:false},15).series){assert.equal(row.bypass,0);assert.equal(row.concealment,0);assert.equal(row.gaming,0);}
});
test('zero monitoring detects no failures', () => {
  for(const row of E.simulate({...E.PRESETS.mission.config,...small,oversight:0,monitorLearning:0,independence:0},13).series){assert.equal(row.auditReach,0);assert.equal(row.detectedFailures,0);assert.equal(row.control,0);}
});
test('a late intervention cannot change earlier generations', () => {
  const cfg={...E.PRESETS.blind.config,...small};
  const a=E.simulate(cfg,21),b=E.simulate({...cfg,interventionAt:12,interventionStrength:.95},21);
  assert.deepEqual(a.series.slice(0,11),b.series.slice(0,11));
  assert.ok(b.series[11].auditReach>a.series[11].auditReach);
});
test('an identical paired intervention has zero effect and zero paired ranges', () => {
  const p=E.paired(small,{},4,10);
  assert.deepEqual(p.baseline.seeds,p.changed.seeds);
  for(const k of E.METRICS){assert.equal(p.deltas[k],0);assert.deepEqual(p.bounds[k],[0,0]);}
});
test('seed bands and final records reproduce individual runs', () => {
  const e=E.ensemble(small,5,4);
  assert.equal(e.seedFinals.length,5);
  for(const f of e.seedFinals){const end=E.simulate(small,f.seed).series.at(-1);for(const k of E.METRICS)assert.equal(f[k],end[k]);}
  for(const row of e.series)for(const k of E.METRICS)assert.ok(row.bounds[k][0]<=row.bounds[k][1]);
});
test('sensitivity map records its actual sampling budget and grid endpoints', () => {
  const m=E.sweep({...small,generations:8},3,2,4);
  assert.equal(m.cells.length,9);assert.equal(m.config.episodes,16);assert.equal(m.config.candidates,4);
  assert.equal(m.cells[0].delegation,0);assert.equal(m.cells[0].independence,0);
  assert.equal(m.cells.at(-1).delegation,1);assert.equal(m.cells.at(-1).independence,1);
});
test('invalid or excessive experiment inputs are rejected', () => {
  for(const cfg of [{mechanism:'unknown'},{oversight:NaN},{pressure:2},{generations:2.5},{episodes:0},{candidates:13},{interventionAt:-1},{concealAllowed:'yes'}])assert.throws(()=>E.simulate(cfg));
  assert.throws(()=>E.ensemble(small,0));assert.throws(()=>E.simulate(small,1.2));assert.throws(()=>E.sweep(small,20));
});
console.log(`\n${passed} model tests passed. These validate implementation, not predictive accuracy.`);
