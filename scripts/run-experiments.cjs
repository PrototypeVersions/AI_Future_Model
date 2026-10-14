'use strict';
const fs = require('node:fs');
const path = require('node:path');
const E = require('../engine.js');
const directory = path.join(__dirname,'..','results');
fs.mkdirSync(directory,{recursive:true});
const runs=32,seed=42,summary={version:E.VERSION,sourceSnapshot:'2026-10-14',description:'Illustrative conditional simulations. No real-world probability calibration.',runs,seed,scenarios:[]};
for(const [id,p] of Object.entries(E.PRESETS)){
  const result=E.ensemble(p.config,runs,seed);
  fs.writeFileSync(path.join(directory,id+'.json'),JSON.stringify(result,null,2)+'\n');
  const columns=['generation',...E.METRICS];
  fs.writeFileSync(path.join(directory,id+'.csv'),[columns.join(','),...result.series.map(r=>columns.map(k=>r[k]).join(','))].join('\n')+'\n');
  summary.scenarios.push({id,name:p.name,config:result.config,final:result.final});
  console.log(p.name+': welfare '+(result.final.welfare*100).toFixed(1)+' pts; hidden failures '+(result.final.hiddenFailures*100).toFixed(1)+'%');
}
const paired=E.paired(E.PRESETS.blind.config,{interventionAt:24,interventionStrength:.85},runs,seed);
fs.writeFileSync(path.join(directory,'oversight-intervention.json'),JSON.stringify(paired,null,2)+'\n');
const sensitivity=E.sweep(E.PRESETS.blind.config,7,8,seed);
fs.writeFileSync(path.join(directory,'sensitivity.json'),JSON.stringify(sensitivity,null,2)+'\n');
fs.writeFileSync(path.join(directory,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log('Saved reproducible scenario, sensitivity, and paired-intervention results.');
