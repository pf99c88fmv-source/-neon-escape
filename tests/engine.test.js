import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {FIXED_STEP,SPB,validateChart,createRun,setTarget,advanceRun,accuracy,PLAYER_RADIUS} from "../src/engine.js";

const source=JSON.parse(await readFile(new URL("../assets/charts/rave-140.json",import.meta.url),"utf8"));
function tiny(gateBeat=.1166666667,dir=-1){
  return {chartId:"test",bpm:140,beatsPerBar:4,durationBeats:16,sections:[{id:"intro",startBeat:0,endBeat:16}],
    events:[{id:"g1",type:"crossGate",beat:gateBeat,x:150/360,direction:dir,risk:false}]};
}
function moveAcross(chart){
  const run=createRun(chart);setTarget(run,-30);
  for(let i=1;i<=12;i++)advanceRun(run,chart,i*FIXED_STEP/SPB,FIXED_STEP);
  return run;
}

test("playable chart uses 140 BPM, 4/4 and valid deterministic events",()=>{
  assert.equal(validateChart(source).bpm,140);
  assert.equal(source.beatsPerBar,4);
  assert.equal(source.events.filter(e=>e.type==="wall").length,28);
  assert.equal(source.events.filter(e=>e.type==="crossGate").length,51);
  for(const e of source.events)assert.ok(e.id&&Number.isFinite(e.beat));
});
test("chart validation rejects wrong tempo, duplicate IDs and broken risk reference",()=>{
  assert.throws(()=>validateChart({...tiny(),bpm:128}),/140 BPM/);
  const duplicate=tiny();duplicate.events.push({...duplicate.events[0]});
  assert.throws(()=>validateChart(duplicate),/повторяющийся/);
  const broken=tiny();broken.events[0]={...broken.events[0],risk:true,hazardId:"missing"};
  assert.throws(()=>validateChart(broken),/нет опасности/);
});
test("crossing a gate exactly on its beat scores once as Perfect",()=>{
  const chart=tiny(),run=moveAcross(chart);
  assert.equal(run.perfect,1);assert.equal(run.good,0);assert.equal(run.score,100);assert.equal(run.combo,1);
  assert.equal(run.gateResults.get("g1"),"perfect");
  advanceRun(run,chart,1,FIXED_STEP);
  assert.equal(run.score,100);
});
test("missed gate resets combo and a built combo raises the score multiplier",()=>{
  const chart=tiny(.2),missed=createRun(chart);
  for(let i=1;i<=120;i++)advanceRun(missed,chart,i*FIXED_STEP/SPB,FIXED_STEP);
  assert.equal(missed.misses,1);assert.equal(missed.combo,0);assert.equal(missed.gateResults.get("g1"),"miss");
  const multiplierChart=tiny(),multiplied=moveAcross(multiplierChart);
  multiplied.combo=8;
  const second=tiny(.1166666667,-1);second.events[0]={...second.events[0],id:"g2"};
  // Recreate a clean run with the multiplier already earned.
  const run=createRun(second);run.combo=8;setTarget(run,-30);
  for(let i=1;i<=12;i++)advanceRun(run,second,i*FIXED_STEP/SPB,FIXED_STEP);
  assert.equal(run.score,200);assert.equal(run.combo,9);
});
test("a readable near-beat crossing receives Good and counts in accuracy",()=>{
  const chart=tiny(.35),run=moveAcross(chart);
  assert.equal(run.good,1);assert.equal(run.perfect,0);assert.equal(run.score,60);assert.equal(accuracy(run,chart),60);
});
test("wrong direction cannot score",()=>{
  const chart=tiny(.5,1),run=moveAcross(chart);
  assert.equal(run.score,0);assert.equal(run.combo,0);
});
test("player movement is clamped to the phone playfield",()=>{
  const run=createRun(tiny());setTarget(run,-10000);
  assert.equal(run.targetX,16);setTarget(run,20000);assert.equal(run.targetX,344);
  assert.equal(PLAYER_RADIUS,8);
});
test("the two risk routes retain their clearance in Hard",()=>{
  const hard=createRun(source,"hard");
  for(const gate of hard.events.filter(e=>e.risk)){
    const wall=hard.events.find(e=>e.id===gate.hazardId);
    assert.ok(wall);assert.equal(wall.gapWidth,.64);
    const left=(wall.gapCenter-wall.gapWidth/2)*360,right=(wall.gapCenter+wall.gapWidth/2)*360;
    const clearance=Math.min(Math.abs(gate.x*360-left),Math.abs(gate.x*360-right))-PLAYER_RADIUS;
    assert.ok(clearance>=6&&clearance<=12,gate.id+": "+clearance);
  }
});
test("a wall damages the ship only while the ship is outside its opening",()=>{
  const chart={...tiny(),durationBeats:3,events:[{id:"w",type:"wall",beat:1,approachBeats:2,gapCenter:.5,gapWidth:.5,height:24}]};
  const safe=createRun(chart);for(let i=1;i<=160;i++)advanceRun(safe,chart,i*FIXED_STEP/SPB,FIXED_STEP);assert.equal(safe.damage,0);
  const struck=createRun(chart);struck.x=20;struck.targetX=20;
  for(let i=1;i<=160;i++)advanceRun(struck,chart,i*FIXED_STEP/SPB,FIXED_STEP);
  assert.equal(struck.damage,1);assert.equal(struck.lives,2);
});
test("a shield pickup is collected on its scheduled beat",()=>{
  const chart={...tiny(),durationBeats:64,events:[]},run=createRun(chart);
  const count=Math.ceil(59*SPB/FIXED_STEP);
  for(let i=1;i<=count;i++)advanceRun(run,chart,i*FIXED_STEP/SPB,FIXED_STEP);
  assert.equal(run.shield,1);assert.equal(run.collected,1);
});
test("a laser remains dangerous for its full active window",()=>{
  const chart={...tiny(),durationBeats:64,events:[]},run=createRun(chart);
  for(let i=1;i<=Math.ceil(36.1*SPB/FIXED_STEP);i++)advanceRun(run,chart,i*FIXED_STEP/SPB,FIXED_STEP);
  setTarget(run,130);
  for(let i=0;i<30;i++)advanceRun(run,chart,run.beat+FIXED_STEP/SPB,FIXED_STEP);
  assert.equal(run.damage,1);assert.ok(run.processed.has("laser:beam-36"));
});
