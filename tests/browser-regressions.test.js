import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import * as engine from '../src/engine.js';

const source=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const chart=JSON.parse(await readFile(new URL('../assets/charts/rave-140.json',import.meta.url),'utf8'));
const mp3=await readFile(new URL('../assets/audio/neon-rush-140.mp3',import.meta.url));

// Exercise the real browser wrapper with deterministic DOM/audio clocks. No audio hardware is emulated.
function fixture({width=390,height=844,telegram,reduced=false}={}){
  const elements=new Map(),events=new Map(),oscillators=[];
  function element(id){
    const classes=new Set(),properties=new Map();
    return {id,style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k),getPropertyValue:k=>properties.get(k)||''},
      classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k),add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)},
      listeners:new Map(),addEventListener(n,f){this.listeners.set(n,f)},setPointerCapture(){},dataset:{},value:'',textContent:''};
  }
  for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],element(match[1]));
  const drawing=new Proxy({setTransform(...a){this.transform=a},createLinearGradient(){return {addColorStop(){}}}}, {get:(o,k)=>o[k]||(()=>{})});
  elements.get('game').getContext=()=>drawing;
  const normal=element('normal');normal.dataset.difficulty='normal';
  class AudioParam{value=0;setValueAtTime(){}exponentialRampToValueAtTime(){}setTargetAtTime(){}}
  function node(){return {gain:new AudioParam(),frequency:new AudioParam(),threshold:new AudioParam(),knee:new AudioParam(),ratio:new AudioParam(),attack:new AudioParam(),release:new AudioParam(),connect(){},start(...a){this.started=a},stops:[],stop(...a){this.stops.push(a)}}}
  class AudioContext{
    currentTime=1;sampleRate=44100;state='running';listeners=new Map();
    addEventListener(n,f){this.listeners.set(n,f)}
    createGain(){return node()}createDynamicsCompressor(){return node()}createOscillator(){const o=node();oscillators.push(o);return o}createBufferSource(){return node()}createBiquadFilter(){return node()}
    createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)}}
    decodeAudioData(){return Promise.resolve({duration:55})}
    resume(){this.state='running';return Promise.resolve()}
    suspend(){this.state='suspended';this.listeners.get('statechange')?.();return Promise.resolve()}
  }
  const document={hidden:false,getElementById:id=>elements.get(id),querySelectorAll:q=>q==='.screen'?[...elements.values()].filter(e=>e.id.endsWith('-screen')):[normal],querySelector:()=>normal};
  const sandbox={engine,document,innerWidth:width,innerHeight:height,devicePixelRatio:1,performance:{now:()=>1000},crypto:webcrypto,
    localStorage:{getItem:()=>null,setItem(){}},navigator:{},AudioContext,matchMedia:()=>({matches:reduced}),
    requestAnimationFrame(){},setTimeout(){},clearTimeout(){},addEventListener:(n,f)=>events.set(n,f),
    fetch:async url=>({ok:true,json:async()=>chart,arrayBuffer:async()=>mp3.buffer.slice(mp3.byteOffset,mp3.byteOffset+mp3.byteLength)})};
  if(telegram)sandbox.Telegram={WebApp:telegram};
  sandbox.window=sandbox;
  const context=vm.createContext(sandbox);
  vm.runInContext(source.replace(/^import[^\n]+\n/,'const {SPB,FIXED_STEP,PLAYER_RADIUS,MAX_SPEED,validateChart,createRun,setTarget,advanceRun,makeLasers,makePickups,activeSection,accuracy}=engine;\n')+
    '\nglobalThis.probe={fit,safeArea,render,ensureAudio,startCountIn,audibleBeat,pauseRun,begin,resumeRun,leaveToMenu,shareResult,keys};',context);
  return {state:sandbox.__MAKAR_GAME__.state,probe:sandbox.probe,elements,drawing,events,document,sandbox,oscillators};
}
function ready(f){f.probe.ensureAudio();f.state.chart=chart;f.state.buffer={duration:55};f.state.run=engine.createRun(chart);f.state.screen='playing';f.state.startAt=1;}

test('landscape uses the same scale for drawing and drag; ship stays inside canvas',()=>{
  const f=fixture({width:844,height:390});ready(f);f.probe.fit();f.probe.render(1000);
  assert.equal(f.drawing.transform[3],f.state.scale);
  assert.ok(f.state.playerY*f.drawing.transform[3]<390);
  assert.equal(f.elements.get('app').style.height,'390px');
});
test('safe area returns to CSS env fallback when Telegram clears an inset',()=>{
  const tg={safeAreaInset:{top:40,bottom:25},contentSafeAreaInset:{},onEvent(){}};
  const f=fixture({telegram:tg});assert.equal(f.elements.get('app').style.getPropertyValue('--safe-t'),'40px');
  tg.safeAreaInset={};f.probe.safeArea();assert.equal(f.elements.get('app').style.getPropertyValue('--safe-t'),'');
});
test('system reduced motion and the in-game toggle also affect Canvas and CSS state',()=>{
  const f=fixture({reduced:true});assert.equal(f.state.settings.reduced,true);assert.ok(f.elements.get('app').classList.contains('reduced-effects'));
  f.elements.get('reduced-motion').listeners.get('change')({target:{checked:false}});
  assert.equal(f.state.settings.reduced,false);assert.equal(f.elements.get('app').classList.contains('reduced-effects'),false);
});
test('pause preserves music transport independently of rhythm correction, including repeated resume',()=>{
  for(const offset of [-150,0,150]){
    const f=fixture();ready(f);f.state.settings.offset=offset;
    for(let i=0;i<3;i++){
      const from=f.state.offsetBeat;f.state.audio.currentTime=f.state.startAt+.9;
      f.state.run.beat=from+(.9-offset/1000)/engine.SPB;
      const expected=from+.9/engine.SPB;f.probe.pauseRun(false);
      assert.ok(Math.abs(f.state.offsetBeat-expected)<1e-8);
      f.probe.startCountIn(f.state.offsetBeat);
      assert.ok(Math.abs(f.state.source.started[1]-expected*engine.SPB)<1e-8);
      f.state.audio.currentTime=f.state.startAt+.3;
      assert.ok(Math.abs(f.probe.audibleBeat()-(expected+(.3-offset/1000)/engine.SPB))<1e-8);
      f.state.screen='playing';
    }
  }
});
test('pause stops all scheduled count-in ticks and releases held keyboard input',()=>{
  const f=fixture();ready(f);f.probe.startCountIn(0);const ticks=[...f.oscillators];f.probe.keys.add('a');f.probe.pauseRun(true);
  assert.equal(f.state.source,null);assert.equal(f.probe.keys.size,0);assert.ok(ticks.every(t=>t.stops.at(-1).length===0));
});
test('audio interruption pauses the game until explicit resume',async()=>{
  const f=fixture();ready(f);await f.state.audio.suspend();assert.equal(f.state.screen,'pause');assert.equal(f.state.interrupted,true);
});
test('track finishing loading in the background cannot start a source or count-in',async()=>{
  const f=fixture();const pending=f.probe.begin();f.document.hidden=true;f.events.get('visibilitychange')();await pending;
  assert.equal(f.state.screen,'menu');assert.equal(f.state.source,null);assert.equal(f.oscillators.length,0);
});
test('late or duplicate audio resume cannot restart gameplay after navigation or interruption',async()=>{
  const f=fixture();ready(f);f.probe.pauseRun(false);let release;let calls=0;
  f.state.audio.resume=()=>{calls++;return new Promise(r=>release=r)};
  f.probe.resumeRun();f.probe.resumeRun();assert.equal(calls,1);f.probe.leaveToMenu();release();await new Promise(r=>setImmediate(r));
  assert.equal(f.state.screen,'menu');assert.equal(f.state.source,null);
  const bg=fixture();ready(bg);bg.probe.pauseRun(false);let unlock;bg.state.audio.resume=()=>new Promise(r=>unlock=r);
  bg.probe.resumeRun();bg.probe.pauseRun(true);unlock();await new Promise(r=>setImmediate(r));
  assert.equal(bg.state.screen,'pause');assert.equal(bg.state.source,null);
});
test('text result avoids Telegram prepared-message API and catches clipboard refusal',async()=>{
  let wrongApi=false;const f=fixture({telegram:{shareMessage(){wrongApi=true},onEvent(){}}});ready(f);
  f.sandbox.navigator.clipboard={writeText:async()=>{throw Error('denied')}};
  await f.probe.shareResult();assert.equal(wrongApi,false);assert.equal(f.elements.get('toast').textContent,'НЕ УДАЛОСЬ ПОДЕЛИТЬСЯ');
});
