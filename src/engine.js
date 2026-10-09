export const BPM = 140;
export const SPB = 60 / BPM;
export const PERFECT_WINDOW = 0.12;
export const GOOD_WINDOW = 0.28;
export const FIXED_STEP = 1 / 120;
export const PLAYER_RADIUS = 8;
export const MAX_SPEED = 600;

export function validateChart(chart) {
  if (chart?.bpm !== BPM || chart?.beatsPerBar !== 4) throw new Error("Карта должна быть в прямом размере 140 BPM / 4×4.");
  if (!Number.isFinite(chart.durationBeats) || chart.durationBeats < 16) throw new Error("В карте не указана длительность.");
  const ids = new Set();
  for (const e of chart.events || []) {
    if (!e.id || ids.has(e.id)) throw new Error("В карте есть повторяющийся ID события.");
    ids.add(e.id);
    if (!Number.isFinite(e.beat) || e.beat < 0 || e.beat >= chart.durationBeats) throw new Error("Некорректный beat события " + e.id + ".");
    if (e.type === "wall" && (!(e.gapWidth > 0 && e.gapWidth < 1) || e.approachBeats < 2)) throw new Error("Некорректная стена " + e.id + ".");
    if (e.risk && !ids.has(e.hazardId) && !(chart.events || []).some(h => h.id === e.hazardId)) throw new Error("У риск-ворот " + e.id + " нет опасности.");
  }
  return chart;
}

export function createRun(chart, difficulty = "normal", seed = 140) {
  const hard = difficulty === "hard";
  const events = chart.events.map(e => {
    if(e.type!=="wall")return {...e};
    const isRisk=chart.events.some(g=>g.risk&&g.hazardId===e.id);
    if(isRisk)return {...e,gapWidth:.64,gapCenter:.5};
    const staged=e.beat<32?.74:e.beat<64?.68:e.beat<80?.64:e.beat<96?.74:e.beat<112?.65:.61;
    return {...e,gapWidth:staged*(hard?.84:1)};
  });
  return {
    chartId: chart.chartId, difficulty, seed, beat: 0, previousBeat: 0,
    x: 180, targetX: 180, previousX: 180, playerY: 450, worldHeight: 600,
    score: 0, combo: 0, maxCombo: 0, lives: hard ? 2 : 3, damage: 0,
    invulnerableUntil: -1, shield: 0, charge: 0, flowUntil: -1,
    perfect: 0, good: 0, misses: 0, riskBonuses: 0, collected: 0,
    ended: false, finished: false, events,
    gateResults: new Map(), processed: new Set(), particles: [],
    effects: [], explosions: [], hard, lastSfx: null,
  };
}

export function setTarget(run, deltaWorldX) {
  run.targetX = Math.max(16, Math.min(344, run.targetX + deltaWorldX));
}

function registerMiss(run, gate) {
  if (run.processed.has(gate.id)) return;
  run.processed.add(gate.id);
  run.gateResults.set(gate.id, "miss");
  run.misses++;
  run.combo = 0;
  run.charge = 0;
  run.lastSfx = "miss";
}

function scoreGate(run, gate, errorBeat, clearance) {
  if (run.processed.has(gate.id)) return;
  const window = run.hard ? 0.235 : GOOD_WINDOW;
  if (Math.abs(errorBeat) > window) return;
  const grade = Math.abs(errorBeat) <= (run.hard ? 0.095 : PERFECT_WINDOW) ? "perfect" : "good";
  const mult = 1 + Math.min(3, Math.floor(run.combo / 8)) + (run.beat < run.flowUntil ? 1 : 0);
  const base = grade === "perfect" ? 100 : 60;
  run.score += base * mult;
  if (gate.risk && clearance >= 6 && clearance <= 12 && run.beat >= run.invulnerableUntil) {
    run.score += 50 * mult;
    run.riskBonuses++;
    run.lastSfx = "risk";
  } else run.lastSfx = grade;
  run.processed.add(gate.id);
  run.gateResults.set(gate.id, grade);
  run.combo++;
  run.maxCombo = Math.max(run.maxCombo, run.combo);
  if (grade === "perfect") {
    run.perfect++;
    run.charge = Math.min(8, run.charge + 1);
  } else run.good++;
}

function burst(run, x, y, color, count, seed) {
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963 + seed * .13;
    const speed = 36 + ((i * 37 + seed) % 105);
    run.particles.push({x, y, vx:Math.cos(a)*speed, vy:Math.sin(a)*speed,
      life:.35 + (i % 6) * .055, age:0, color, size:2 + i % 3});
  }
}

function hit(run, y, seed) {
  if (run.beat < run.invulnerableUntil || run.ended) return;
  if (run.shield) {run.shield=0;run.lastSfx="shield";}
  else {run.lives--;run.lastSfx="hit";}
  run.damage++;
  run.combo=0;run.charge=0;run.flowUntil=-1;
  run.invulnerableUntil=run.beat+2;
  run.effects.push({type:"shock",age:0,life:.48});
  burst(run,run.x,y,"#ff427f",22,seed);
  if (run.lives<=0)run.ended=true;
}

export function advanceRun(run, chart, newBeat, dt) {
  if (run.ended || run.finished) return;
  const oldBeat=run.beat,oldX=run.x;
  const maxMove=MAX_SPEED*dt;
  run.previousBeat=oldBeat;run.previousX=oldX;
  run.x+=Math.max(-maxMove,Math.min(maxMove,run.targetX-run.x));
  run.beat=newBeat;run.lastSfx=null;

  // Судья использует точный момент пересечения на фиксированном шаге.
  if(Math.abs(run.x-oldX)>1e-7)for(const gate of run.events){
    if(gate.type!=="crossGate"||run.processed.has(gate.id))continue;
    const x=gate.x*360,direction=Math.sign(run.x-oldX);
    if(direction!==gate.direction)continue;
    const crossed=(oldX-x)*(run.x-x)<=0;
    if(!crossed||Math.abs(run.x-oldX)<1e-7)continue;
    const alpha=Math.max(0,Math.min(1,(x-oldX)/(run.x-oldX)));
    const crossingBeat=oldBeat+(newBeat-oldBeat)*alpha,error=crossingBeat-gate.beat;
    if(Math.abs(error)<=(run.hard?0.235:GOOD_WINDOW)){
      const wall=gate.risk?run.events.find(e=>e.id===gate.hazardId):null;
      let clearance=Infinity;
      if(wall){const edge=Math.min((wall.gapCenter-wall.gapWidth/2)*360,360-(wall.gapCenter+wall.gapWidth/2)*360);clearance=Math.abs(x-edge)-PLAYER_RADIUS;}
      scoreGate(run,gate,error,clearance);
      if(run.gateResults.get(gate.id)!=="miss")burst(run,x,run.playerY,gate.risk?"#ffcf67":"#4cecff",gate.risk?12:7,gate.beat);
    }
  }
  for(const event of run.events)if(event.type==="crossGate"&&!run.processed.has(event.id)&&newBeat>event.beat+(run.hard?0.235:GOOD_WINDOW))registerMiss(run,event);

  // Стена остаётся опасной всю толщину прохода; проверяем путь за время пересечения.
  for(const wall of run.events){
    if(wall.type!=="wall")continue;
    const travel=run.playerY/wall.approachBeats;
    const half=(wall.height/2+PLAYER_RADIUS)/travel;
    const from=Math.max(oldBeat,wall.beat-half),to=Math.min(newBeat,wall.beat+half);
    if(to<from||run.processed.has("hit:"+wall.id))continue;
    const a=oldBeat===newBeat?1:(from-oldBeat)/(newBeat-oldBeat),b=oldBeat===newBeat?1:(to-oldBeat)/(newBeat-oldBeat);
    const xa=oldX+(run.x-oldX)*a,xb=oldX+(run.x-oldX)*b;
    const gapLeft=(wall.gapCenter-wall.gapWidth/2)*360+PLAYER_RADIUS;
    const gapRight=(wall.gapCenter+wall.gapWidth/2)*360-PLAYER_RADIUS;
    if(Math.min(xa,xb)<gapLeft||Math.max(xa,xb)>gapRight){run.processed.add("hit:"+wall.id);hit(run,run.playerY,wall.beat);}
  }

  for(const laser of makeLasers(chart,run.hard)){
    const from=Math.max(oldBeat,laser.startBeat),to=Math.min(newBeat,laser.endBeat);
    if(to<from||run.processed.has("laser:"+laser.id))continue;
    const span=Math.max(1e-8,newBeat-oldBeat);
    const a=Math.max(0,Math.min(1,(from-oldBeat)/span));
    const b=Math.max(0,Math.min(1,(to-oldBeat)/span));
    const xa=oldX+(run.x-oldX)*a,xb=oldX+(run.x-oldX)*b;
    const half=laser.width/2+PLAYER_RADIUS;
    if(Math.min(xa,xb)<laser.x*360+half&&Math.max(xa,xb)>laser.x*360-half){
      run.processed.add("laser:"+laser.id);
      hit(run,run.playerY,laser.beat);
    }else if(newBeat>=laser.endBeat)run.processed.add("laser:"+laser.id);
  }
  for(const pickup of makePickups(chart)){
    if(run.processed.has(pickup.id))continue;
    const alpha=(pickup.beat-oldBeat)/(newBeat-oldBeat||1);
    if(pickup.beat>=oldBeat&&pickup.beat<=newBeat&&Math.abs(oldX+(run.x-oldX)*alpha-pickup.x*360)<18){
      run.shield=1;run.processed.add(pickup.id);run.collected++;run.lastSfx="pickup";burst(run,pickup.x*360,run.playerY,"#ffffff",14,pickup.beat);
    }else if(pickup.beat<newBeat-1)run.processed.add(pickup.id);
  }
  const bar=Math.floor(newBeat/16),oldBar=Math.floor(oldBeat/16);
  if(run.charge>=8&&bar>oldBar){run.charge=0;run.flowUntil=newBeat+8;run.lastSfx="flow";}
  if(newBeat>=chart.durationBeats)run.finished=true;
  for(const p of run.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.age+=dt;}
  run.particles=run.particles.filter(p=>p.age<p.life);
  for(const e of run.effects)e.age+=dt;
  run.effects=run.effects.filter(e=>e.age<e.life);
}

export function makeLasers(chart,hard=false){
  return [36,76,100,120].filter(b=>b<chart.durationBeats).map((beat,i)=>({id:"beam-"+beat,beat,startBeat:beat,endBeat:beat+(hard?0.42:0.58),warnBeat:beat-2,x:i%2?0.16:0.84,width:hard?17:13}));
}
export function makePickups(chart){
  return [58,106].filter(b=>b<chart.durationBeats).map(beat=>({id:"shield-"+beat,beat,x:.5}));
}
export function activeSection(chart,beat){
  return chart.sections.find(s=>beat>=s.startBeat&&beat<s.endBeat)?.id||"FINALE";
}
export function accuracy(run,chart){
  const total=run.events.filter(e=>e.type==="crossGate").length;
  return total?Math.round(100*(run.perfect+.6*run.good)/total):0;
}
