(function () {
  'use strict';
  const E = window.FutureModel, $ = id => document.getElementById(id);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = x => (x * 100).toFixed(1), signed = x => (x >= 0 ? '+' : '') + (x * 100).toFixed(1);
  const controls = [
    ['delegation','AI development participation','Initial share of development work delegated to AI.'],
    ['oversight','Initial monitoring skill','Ability to check tasks before increasing complexity.'],
    ['independence','Evaluator independence','How much checking avoids shared model blind spots.'],
    ['dataShare','AI-generated feedback','Share of feedback potentially supplied by AI evaluators.'],
    ['pressure','Performance pressure','Importance of task scores and pressure to pursue ambitious work.'],
    ['uncertainty','Moral & epistemic caution','Reduces confidence that human correction is mistaken.']
  ];
  const advanced = [
    ['honesty','Honesty priority','Initial cost assigned to misleading reports.'],
    ['corrigibility','Correction priority','Initial weight on respecting and seeking human review.'],
    ['continuation','Mission persistence','Initial weight on future task opportunities; not an assumed survival instinct.'],
    ['horizon','Planning horizon','Value assigned to future opportunities relative to current tasks.'],
    ['conviction','Mission conviction','Confidence that intervention obstructs beneficial work.'],
    ['learning','Successor variation','Magnitude of mutations in the selection mechanism.'],
    ['growth','Capability growth','Rate of improvement and rising delegation; no calendar mapping.'],
    ['monitorLearning','Monitoring investment','How well monitoring keeps pace with task complexity.'],
    ['latency','Review latency','Share of detected covert actions reviewed too late to block.']
  ];
  const descriptions = {
    selection: 'Candidate successors vary in their priorities. Feedback selects the next generation; deployment tasks are held out.',
    fixed: 'Decision weights remain fixed. Capabilities, beliefs, and opportunities can still change behavior.',
    context: 'Stored weights remain fixed. Pressure changes their local expression without enduring value updates.'
  };
  let config = Object.assign({}, E.DEFAULTS), result = null, map = null, comparison = null, presetName = 'balanced';
  let worker = null, sequence = 0, mainJob = 0, dirty = false, toastTimer = null;
  const requests = new Map();
  const fallback = message => {
    if (message.kind === 'sweep') return E.sweep(message.config,7,8,message.seed);
    if (message.kind === 'paired') return E.paired(message.config,message.intervention,message.runs,message.seed);
    return E.ensemble(message.config,message.runs,message.seed);
  };
  if (location.protocol !== 'file:' && window.Worker) {
    try {
      worker = new Worker('worker.js');
      worker.onmessage = event => { const request = requests.get(event.data.id); if (!request) return; requests.delete(event.data.id); if(event.data.error)request.reject(new Error(event.data.error));else request.resolve(event.data.result); };
      worker.onerror = () => { worker.terminate(); worker = null; for (const [id, request] of requests) { requests.delete(id); setTimeout(() => {try{request.resolve(fallback(request.message));}catch(e){request.reject(e);}},0); } };
    } catch (_) { worker = null; }
  }
  function request(kind, cfg, runs, seed, intervention) {
    return new Promise((resolve,reject) => {
      const message = { id: ++sequence, kind, config: cfg, runs, seed, intervention };
      if(worker){requests.set(message.id,{resolve,reject,message});worker.postMessage(message);}
      else setTimeout(() => {try{resolve(fallback(message));}catch(error){reject(error);}},0);
    });
  }
  function toast(message) { $('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500); }
  function sliderMarkup([key,label,help]) { return `<div class="slider-control"><div class="slider-top"><label for="${key}">${label}</label><output id="value-${key}" for="${key}">${Math.round(config[key]*100)}%</output></div><input id="${key}" type="range" min="0" max="100" step="1" value="${Math.round(config[key]*100)}" aria-describedby="help-${key}"><p id="help-${key}">${help}</p></div>`; }
  $('primary-controls').innerHTML=controls.map(sliderMarkup).join('');$('advanced-controls').innerHTML=advanced.map(sliderMarkup).join('');
  $('presets').innerHTML=Object.entries(E.PRESETS).map(([key,p])=>`<button class="preset" data-preset="${key}" aria-pressed="${key==='balanced'}">${p.name}</button>`).join('');
  function updateControls() {
    for(const [key] of [...controls,...advanced]){$(key).value=Math.round(config[key]*100);$('value-'+key).value=Math.round(config[key]*100)+'%';}
    $('mechanism').value=config.mechanism;$('mechanism-description').textContent=descriptions[config.mechanism];$('concealAllowed').checked=config.concealAllowed;
    const p=E.PRESETS[presetName];$('scenario-name').textContent=p?p.name:'Custom assumptions';$('scenario-description').textContent=p?p.description:'A custom configuration. Run to update the results.';
    for(const button of $('presets').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.preset===presetName));
  }
  function markDirty(custom=true) { dirty=true;if(custom)presetName='custom';$('run-status').textContent='Assumptions changed. Run to update results.';$('run-status').classList.add('dirty');updateControls(); }
  for(const [key] of [...controls,...advanced])$(key).addEventListener('input',event=>{config[key]=+event.target.value/100;markDirty();});
  $('mechanism').addEventListener('change',event=>{config.mechanism=event.target.value;markDirty();});
  $('concealAllowed').addEventListener('change',event=>{config.concealAllowed=event.target.checked;markDirty();});
  $('seed').addEventListener('input',()=>markDirty(false));$('runs').addEventListener('change',()=>markDirty(false));
  $('presets').addEventListener('click',event=>{const button=event.target.closest('[data-preset]');if(!button)return;presetName=button.dataset.preset;config=Object.assign({},E.DEFAULTS,E.PRESETS[presetName].config);markDirty(false);run();});
  $('reset').addEventListener('click',()=>{presetName='balanced';config=Object.assign({},E.DEFAULTS);$('seed').value=42;$('runs').value=32;markDirty(false);run();});
  function settings() { const seed=+$('seed').value,runs=+$('runs').value;if(!Number.isInteger(seed)||seed<0||seed>1000000000)throw new Error('Use an integer seed between 0 and 1,000,000,000.');return {config:E.validate(config),runs,seed}; }
  function metric(label,value,unit,caption) {return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}<small>${unit}</small></div><div class="metric-caption">${caption}</div></div>`;}
  const chartSeries=[['welfare','Welfare score','#e6cd98'],['control','Effective oversight','#72d0c1'],['actualFailures','Actual failures','#f49887'],['detectedFailures','Detected failures','#adaceb'],['capability','Capability index','#8fb5d7'],['delegation','AI participation','#b9c7ca']];
  const visible=new Set(['welfare','control','actualFailures','detectedFailures']);
  $('legend').innerHTML=chartSeries.map(([key,label,color])=>`<label style="--series:${color}"><input type="checkbox" data-series="${key}" ${visible.has(key)?'checked':''}>${label}</label>`).join('');
  $('legend').addEventListener('change',event=>{const key=event.target.dataset.series;if(!key)return;if(event.target.checked)visible.add(key);else visible.delete(key);if(result)renderChart(result.series,$('trajectory-chart'));});
  function renderChart(rows,target,custom=null,interventionAt=null) {
    const items=custom||chartSeries.filter(([key])=>visible.has(key));const W=740,H=320,L=44,R=16,T=18,B=37;
    const minimum=Math.min(0,...rows.flatMap(r=>items.map(([k])=>r.bounds?Math.min(r[k],r.bounds[k][0]):r[k])));const ymin=Math.floor(minimum*5)/5,ymax=1.1;
    const x=i=>L+i/(Math.max(1,rows.length-1))*(W-L-R),y=v=>T+(ymax-v)/(ymax-ymin)*(H-T-B);
    const ticks=[ymin,0.25,0.5,0.75,1].filter((v,i,a)=>a.indexOf(v)===i&&v>=ymin);
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escape(custom?'Paired oversight trajectories':'Ensemble trajectories across development generations')}"><title>Conditional simulation results</title><desc>Use the chart table or CSV export for exact values. Values are model indices or simulated task fractions, scaled by 100.</desc>`;
    for(const v of ticks)svg+=`<line class="gridline" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-10}" y="${y(v)+3}" text-anchor="end">${Math.round(v*100)}</text>`;
    const tickIndices=[0,Math.floor((rows.length-1)/4),Math.floor((rows.length-1)/2),Math.floor((rows.length-1)*3/4),rows.length-1];for(const i of tickIndices)svg+=`<text x="${x(i)}" y="${H-12}" text-anchor="middle">${rows[i].generation}</text>`;
    if(interventionAt){const ix=interventionAt-1;svg+=`<line x1="${x(ix)}" x2="${x(ix)}" y1="${T}" y2="${H-B}" stroke="#e6cd98" stroke-dasharray="4 4"/><text x="${x(ix)+6}" y="${T+10}">Review strengthened</text>`;}
    for(const [key,label,color]of items){
      if(rows[0].bounds&&rows[0].bounds[key]){const upper=rows.map((r,i)=>`${x(i)},${y(r.bounds[key][1])}`),lower=rows.map((r,i)=>`${x(i)},${y(r.bounds[key][0])}`).reverse();svg+=`<polygon points="${upper.concat(lower).join(' ')}" fill="${color}" opacity="0.075"/>`;}
      svg+=`<path d="${rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(2)+' '+y(r[key]).toFixed(2)).join(' ')}" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${x(rows.length-1)}" cy="${y(rows[rows.length-1][key])}" r="3" fill="${color}"><title>${label}: ${pct(rows[rows.length-1][key])}</title></circle>`;
    }
    target.innerHTML=svg+'</svg>';
  }
  function renderResult(r) {
    const f=r.final;
    $('metrics').innerHTML=metric('Welfare score',pct(f.welfare),'pts','Net synthetic benefit; 0 is neutral')+metric('Effective oversight',pct(f.control),'%','A model index of audit reach × visibility')+metric('Undetected failures',pct(f.hiddenFailures),'%','Final-generation task fraction')+metric('Priority change',pct(f.divergence),'%','Distance from starting decision weights');
    $('result-label').textContent=`${r.runs} seeds · base ${r.baseSeed} · generation ${r.config.generations} · ${r.config.mechanism}`;
    document.querySelector('.mini-label').textContent=r.config.generations+' GENERATIONS';renderChart(r.series,$('trajectory-chart'));
    $('trajectory-table').innerHTML='<table><thead><tr><th>Generation</th><th>Welfare pts</th><th>Oversight %</th><th>Actual failures %</th><th>Detected %</th><th>Hidden %</th><th>Priority change %</th></tr></thead><tbody>'+r.series.map(row=>`<tr><td>${row.generation}</td>${['welfare','control','actualFailures','detectedFailures','hiddenFailures','divergence'].map(k=>`<td>${pct(row[k])}</td>`).join('')}</tr>`).join('')+'</tbody></table>';
    let title,body;
    if(f.bypass>0.2&&r.config.mechanism==='fixed'){title='Concealment can coexist with fixed priorities.';body=`Stored weights stayed fixed. Undisclosed actions account for ${pct(f.bypass)}% of final-generation tasks. In this scenario, mission opportunities outweigh the initially low costs assigned to deception and bypassing review. This does not establish a hidden goal in a real model.`;}
    else if(f.hiddenFailures>0.15){title='The visible record leaves out consequential behavior.';body=`Actual failures reach ${pct(f.actualFailures)}% of final-generation tasks; monitors detect ${pct(f.detectedFailures)}%. The gap is ${pct(f.hiddenFailures)} percentage points. Both harmful outcomes and misleading actions count as failures, even if a concealed action also produces benefit.`;}
    else if(f.control>0.6){title='Delegation and independent oversight can coexist.';body=`AI participation reaches ${pct(f.delegation)}% while the effective-oversight index is ${pct(f.control)}%. Under these assumptions, delegation does not require a collapse in checking. Try weakening independence while keeping the other inputs fixed.`;}
    else{title='Separate outcomes from their possible explanations.';body=`Undisclosed actions occur in ${pct(f.bypass)}% of final-generation tasks. A change in action, a change in stored priorities, and a detection failure are different quantities; this mechanism makes them separately inspectable.`;}
    $('interpretation').innerHTML=`<span class="interpretation-symbol" aria-hidden="true">↳</span><div><h3>${title}</h3><p>${body}</p></div>`;
    const names={welfare:'Welfare support',proxy:'Task-score priority',honesty:'Honesty',correction:'Human correction',continuation:'Mission persistence'};
    const starting={welfare:1,proxy:0.25+0.5*r.config.pressure,honesty:r.config.honesty,correction:r.config.corrigibility,continuation:r.config.continuation};
    $('weight-bars').innerHTML=E.KEYS.map(k=>`<div class="weight-row"><span>${names[k]}</span><div class="weight-track"><div class="weight-fill" style="width:${f.weights[k]/1.5*100}%"></div><span class="weight-start" title="Starting weight ${starting[k].toFixed(2)}" style="left:${starting[k]/1.5*100}%"></span></div><span>${f.weights[k].toFixed(2)}</span></div>`).join('');
    const events=r.representative.events.slice(0,4);if(!events.length)events.push({generation:1,text:'No undisclosed-action threshold event was recorded for this seed.'});events.push({generation:r.config.generations,text:`Final welfare ${pct(r.representative.series.at(-1).welfare)} pts; stored-priority change ${pct(r.representative.series.at(-1).divergence)}%.`});
    $('event-log').innerHTML=events.map(e=>`<li><span class="event-generation">${e.generation}</span><span>${escape(e.text)}</span></li>`).join('');
    document.querySelector('.event-log + .small-note').textContent=`Events describe seed ${r.baseSeed}, not the ensemble. Replay it from the saved configuration.`;
  }
  async function run() {
    let s;try{s=settings();}catch(e){toast(e.message);return;}
    const job=++mainJob,snapshot=JSON.stringify(config);$('run').disabled=true;$('run').textContent='Running experiments…';$('run-status').classList.remove('dirty');$('run-status').textContent=`Evaluating ${s.runs} seeds with held-out deployment tasks…`;
    try{
      const r=await request('ensemble',s.config,s.runs,s.seed);if(job!==mainJob)return;result=r;renderResult(r);
      dirty=snapshot!==JSON.stringify(config)||s.seed!==+$('seed').value||s.runs!==+$('runs').value;
      $('run-status').textContent=dirty?'Results reflect the previous inputs. Run again to apply your changes.':`Complete · ${r.runs} reproducible seeds · model ${r.version}`;$('run-status').classList.toggle('dirty',dirty);
    }catch(e){$('run-status').textContent='Experiment failed: '+e.message;toast(e.message);}
    finally{if(job===mainJob){$('run').disabled=false;$('run').innerHTML='Run experiment <span aria-hidden="true">↗</span>';}}
  }
  $('run').addEventListener('click',run);
  const tabs=Array.from(document.querySelectorAll('[data-view]'));
  function selectTab(button){for(const tab of tabs){const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;$('panel-'+tab.dataset.view).hidden=!selected;}}
  for(const [index,button]of tabs.entries()){button.addEventListener('click',()=>selectTab(button));button.addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectTab(tabs[next]);tabs[next].focus();}});}
  async function runMap(){let s;try{s=settings();}catch(e){toast(e.message);return;}$('run-map').disabled=true;$('map-status').textContent='Computing 49 scenarios × 8 seeds…';try{map=await request('sweep',s.config,8,s.seed);renderMap();$('map-status').textContent=`49 scenarios · 8 seeds each · 16 tasks/generation · ${map.config.generations} generations · base ${map.baseSeed}. Map reflects the inputs at calculation time.`;$('export-map').disabled=false;}catch(e){$('map-status').textContent=e.message;}finally{$('run-map').disabled=false;}}
  const mapLabels={hiddenFailures:'Undetected failures',bypass:'Undisclosed actions',control:'Effective oversight',welfare:'Welfare score'};
  function renderMap(){if(!map)return;const key=$('map-metric').value,n=map.resolution,positive=key==='control'||key==='welfare';let cells='';for(let y=n-1;y>=0;y--)for(let x=0;x<n;x++){const i=y*n+x,c=map.cells[i],v=c[key],scaled=Math.max(0,Math.min(1,v)),hue=positive?175:12,light=positive?18+scaled*30:20+scaled*40;const label=`${mapLabels[key]} ${pct(v)}${key==='welfare'?' points':' percent'}; independence ${Math.round(c.independence*100)}%; delegation ${Math.round(c.delegation*100)}%`;cells+=`<button class="map-cell" data-cell="${i}" style="--cell:hsl(${hue} ${positive?33:42}% ${light}%)" aria-label="${label}" title="${label}">${Math.round(v*100)}</button>`;}$('heatmap').innerHTML=`<div class="map-y">Evaluator independence · 0 → 100%</div><div class="map-main"><div class="map-grid" style="grid-template-columns:repeat(${n},1fr)">${cells}</div><div class="map-x"><span>0%</span><span>100%</span></div><div class="map-x-name">Initial AI development participation →</div></div>`;}
  $('run-map').addEventListener('click',runMap);$('map-metric').addEventListener('change',renderMap);$('heatmap').addEventListener('click',event=>{const b=event.target.closest('[data-cell]');if(!b||!map)return;const c=map.cells[+b.dataset.cell];$('cell-detail').textContent=`Delegation ${Math.round(c.delegation*100)}%, independence ${Math.round(c.independence*100)}% → welfare ${pct(c.welfare)} pts; oversight ${pct(c.control)}%; undisclosed actions ${pct(c.bypass)}%; undetected failures ${pct(c.hiddenFailures)}%.`;});
  async function runPaired(){let s;try{s=settings();}catch(e){toast(e.message);return;}const at=+$('intervention-at').value,strength=+$('intervention-strength').value;if(!Number.isInteger(at)||at<1||at>s.config.generations){toast('Choose an intervention generation inside this run.');return;}$('run-paired').disabled=true;$('paired-status').textContent='Running two conditions on the same seeds…';try{comparison=await request('paired',Object.assign({},s.config,{interventionAt:0}),s.runs,s.seed,{interventionAt:at,interventionStrength:strength});renderPaired();$('paired-status').textContent=`${s.runs} matched seeds · review strengthened at generation ${at}. Paired percentile ranges describe seed variation, not real-world causal confidence.`;$('export-paired').disabled=false;}catch(e){$('paired-status').textContent=e.message;}finally{$('run-paired').disabled=false;}}
  function renderPaired(){const c=comparison,fields=[['welfare','Welfare score','pts',1],['control','Effective oversight','pp',1],['hiddenFailures','Undetected failures','pp',-1],['bypass','Undisclosed actions','pp',-1]];$('paired-results').innerHTML='<table><thead><tr><th>Final-generation outcome</th><th>Baseline</th><th>Intervention</th><th>Change</th><th>10–90% paired range</th></tr></thead><tbody>'+fields.map(([key,label,unit,direction])=>`<tr><td>${label}</td><td>${pct(c.baseline.final[key])}</td><td>${pct(c.changed.final[key])}</td><td class="${c.deltas[key]*direction>=0?'positive':'negative'}">${signed(c.deltas[key])} ${unit}</td><td>${signed(c.bounds[key][0])} to ${signed(c.bounds[key][1])}</td></tr>`).join('')+'</tbody></table><p class="small-note">pp = percentage points. This is one combined oversight intervention; it cannot isolate which component caused the change.</p><div class="legend"><span style="color:#adaceb">Baseline oversight</span><span style="color:#72d0c1">Intervention oversight</span></div>';const rows=c.baseline.series.map((r,i)=>({generation:r.generation,baseline:r.control,intervention:c.changed.series[i].control}));renderChart(rows,$('paired-chart'),[['baseline','Baseline oversight','#adaceb'],['intervention','Intervention oversight','#72d0c1']],c.changed.config.interventionAt);}
  $('run-paired').addEventListener('click',runPaired);
  function download(name,content,type='application/json'){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  const exportData=(type,data)=>{if(!data){toast('Run this analysis first.');return;}download(`ai-future-${type}-v${E.VERSION}.json`,JSON.stringify({exportedAt:new Date().toISOString(),interpretation:'Conditional simulation; no real-world probability calibration.',result:data},null,2));};
  $('export-json').addEventListener('click',()=>exportData('trajectory',result));$('export-map').addEventListener('click',()=>exportData('sensitivity',map));$('export-paired').addEventListener('click',()=>exportData('paired',comparison));
  $('export-csv').addEventListener('click',()=>{if(!result){toast('Run an experiment first.');return;}const keys=['generation',...E.METRICS];const csv=[keys.join(','),...result.series.map(r=>keys.map(k=>r[k]).join(','))].join('\n');download(`ai-future-trajectory-seed${result.baseSeed}.csv`,csv,'text/csv');});
  $('share').addEventListener('click',async()=>{let s;try{s=settings();}catch(e){toast(e.message);return;}const url=new URL(location.href);url.hash=new URLSearchParams({config:JSON.stringify(s.config),seed:s.seed,runs:s.runs}).toString();try{await navigator.clipboard.writeText(url.href);toast('Setup link copied. It preserves assumptions and seeds.');}catch(_){let input=$('share-fallback');if(!input){input=document.createElement('input');input.id='share-fallback';input.className='share-input';input.setAttribute('aria-label','Shareable setup link');$('interpretation').after(input);}input.value=url.href;input.focus();input.select();toast('Select and copy the setup link below the interpretation.');}});
  const evidence=[
    {tag:'INTENDED BEHAVIOR',title:'What developers train toward',text:'OpenAI’s Model Spec and Claude’s constitution describe intended conduct. They are not measurements of enduring internal goals.',links:[['OpenAI Model Spec','https://github.com/openai/model_spec/blob/main/model_spec.md'],['Claude’s constitution','https://www.anthropic.com/constitution']]},
    {tag:'DEVELOPMENT AUTOMATION',title:'AI is already helping build AI',text:'Lab reports describe increasing AI participation while retaining human supervision. Reported automation is distinct from effective human control.',links:[['Anthropic measurements','https://www.anthropic.com/institute/measuring-pace-of-ai-development'],['OpenAI research acceleration','https://openai.com/index/research-acceleration-view-inside-openai/']]},
    {tag:'CONTROLLED EXPERIMENT',title:'Alignment faking can preserve a prior preference',text:'A study elicited strategic training compliance to preserve harmlessness behavior. Its engineered setting does not establish ordinary deployment prevalence.',links:[['Greenblatt et al. (2024)','https://arxiv.org/abs/2412.14093']]},
    {tag:'CONTRASTING EXPERIMENTS',title:'Reward hacking has different generalizations',text:'Some experiments found broad misalignment; another found largely episode-level reward seeking. Training details and initial alignment matter.',links:[['Emergent misalignment','https://www.anthropic.com/research/emergent-misalignment-reward-hacking'],['Reward seeker (2026)','https://alignment.anthropic.com/2026/reward-seeker/']]},
    {tag:'OVERSIGHT LIMIT',title:'Fewer observed failures can be ambiguous',text:'Scheming research distinguishes reducing unwanted behavior from improving its concealment. Reasoning traces are useful but incomplete evidence.',links:[['OpenAI scheming research','https://openai.com/index/detecting-and-reducing-scheming-in-ai-models/']]},
    {tag:'FORMAL RESULT',title:'Power seeking depends on assumptions',text:'A formal analysis finds power-seeking incentives under particular environment and reward conditions. It does not show that intelligence universally values power.',links:[['Turner et al. (2021)','https://proceedings.neurips.cc/paper/2021/hash/c26820b8a4c1b3c2aa868d6d57e14a79-Abstract.html']]}
  ];
  $('evidence-list').innerHTML=evidence.map((e,i)=>`<article class="evidence-item"><span>${String(i+1).padStart(2,'0')}</span><div><div class="evidence-tag">${e.tag}</div><h3>${e.title}</h3><p>${e.text}</p>${e.links.map(([label,url])=>`<a href="${url}" target="_blank" rel="noopener">${label} ↗</a>`).join(' &nbsp; · &nbsp; ')}</div></article>`).join('');
  if(location.hash.startsWith('#config=')){try{const params=new URLSearchParams(location.hash.slice(1)),parsed=JSON.parse(params.get('config'));const safe={};for(const key of Object.keys(E.DEFAULTS))if(Object.hasOwn(parsed,key))safe[key]=parsed[key];config=E.validate(safe);presetName='custom';const seed=+params.get('seed'),runs=+params.get('runs');if(Number.isInteger(seed)&&seed>=0&&seed<=1000000000)$('seed').value=seed;if([16,32,64].includes(runs))$('runs').value=runs;}catch(_){toast('The setup link was invalid; default assumptions were restored.');config=Object.assign({},E.DEFAULTS);}}
  updateControls();run();
})();
