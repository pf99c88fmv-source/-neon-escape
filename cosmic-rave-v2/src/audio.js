import {SPB} from './course.js';
export class AudioEngine{
 constructor(){this.context=null;this.buffer=null;this.source=null;this.ticks=[];this.offset=0;this.startAt=0;this.perfStartAt=0;this.active=false;this.volume=.82;this.effects=.45;}
 async unlock(){
  if(!this.context){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('В этом браузере нет Web Audio. Открой игру в Safari или Chrome.');const c=this.context=new C();this.master=c.createGain();this.master.gain.value=this.volume;this.master.connect(c.destination);this.fx=c.createGain();this.fx.gain.value=this.effects;this.fx.connect(c.destination);c.addEventListener('statechange',()=>this.onstatechange?.(c.state));}
  await this.context.resume();
 }
 async load(){
  if(this.buffer)return;
  const [metaResponse,audioResponse]=await Promise.all([fetch('./assets/audio/vitty-track.json?v=vitty-1'),fetch('../makar-zhenya-soundtrack.mp3?v=vitty-1')]);
  if(!metaResponse.ok||!audioResponse.ok)throw Error('Не удалось загрузить музыку. Проверь соединение и повтори.');
  const meta=await metaResponse.json(),bytes=await audioResponse.arrayBuffer();
  if(meta.bpm!==132||meta.title!=='VITTY — Out Of My Mind (Original Mix)')throw Error('Неверная конфигурация музыкального трека.');
  if(globalThis.crypto?.subtle){const digest=await crypto.subtle.digest('SHA-256',bytes);const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==meta.sha256)throw Error('Музыка загрузилась с ошибкой. Обнови страницу.');}
  this.buffer=await this.context.decodeAudioData(bytes);this.meta=meta;
  if(Math.abs(this.buffer.duration-meta.duration)>2)throw Error('Загружен неправильный аудиофайл — продолжительность не совпадает.');
 }
 start(offset=0,countIn=true){
  this.stop();this.offset=offset;this.active=true;const delay=countIn?4*SPB:.04;this.startAt=this.context.currentTime+delay;this.perfStartAt=performance.now()+delay*1000;
  if(countIn)for(let i=0;i<4;i++)this.tick(this.context.currentTime+i*SPB,i===0);
  const s=this.source=this.context.createBufferSource();s.buffer=this.buffer;s.connect(this.master);s.start(this.startAt,Math.max(0,offset*SPB));s.onended=()=>{if(this.active){this.active=false;this.onend?.();}};
 }
 tick(time,strong){const c=this.context,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(strong?730:480,time);o.frequency.exponentialRampToValueAtTime(160,time+.06);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(.07,time+.002);g.gain.exponentialRampToValueAtTime(.0001,time+.075);o.connect(g);g.connect(this.fx);o.start(time);o.stop(time+.09);this.ticks.push(o);o.onended=()=>{o.disconnect();g.disconnect();this.ticks=this.ticks.filter(x=>x!==o);};}
 sound(kind){
  if(!this.context||this.effects===0)return;
  const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  const f=kind==='hit'?85:kind==='pulse'?160:kind==='shield'?600:kind==='perfect'?930:kind==='orb'?1100:420;
  o.type=kind==='hit'?'sawtooth':'sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(kind==='pulse'?620:f*.45,t+.13);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(kind==='hit'?.1:kind==='orb'?.012:.028,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(this.fx);o.start(t);o.stop(t+.19);o.onended=()=>{o.disconnect();g.disconnect();};
 }
 transport(){if(['suspended','interrupted'].includes(this.context?.state))return this.wallBeat();return this.offset+Math.max(0,this.context.currentTime-this.startAt)/SPB;}
 wallBeat(offsetMs=0){return Math.max(0,this.offset+(performance.now()-this.perfStartAt-offsetMs)/1000/SPB);}
 remainingCountIn(){return Math.max(0,['suspended','interrupted'].includes(this.context?.state)?(this.perfStartAt-performance.now())/1000:this.startAt-this.context.currentTime);}
 beat(offsetMs=0){
  if(['suspended','interrupted'].includes(this.context?.state))return this.wallBeat(offsetMs);
  let now=this.context.currentTime;
  try{const stamp=this.context.getOutputTimestamp?.();if(stamp?.contextTime>0&&stamp.performanceTime>0)now=stamp.contextTime+(performance.now()-stamp.performanceTime)/1000;}catch{}
  return Math.max(0,this.offset+(now-this.startAt-offsetMs/1000)/SPB);
 }
 async recover(){
  if(!this.context)return false;
  if(this.context.state==='running')return true;
  const inCountdown=performance.now()<this.perfStartAt;
  const beat=this.wallBeat(),offset=this.offset;
  try{await this.context.resume();}catch{return false;}
  if(this.context.state!=='running')return false;
  if(this.active)this.start(inCountdown?offset:beat,inCountdown);
  return true;
 }
 pause(){const offset=this.transport();this.stop();this.offset=offset;return offset;}
 stop(){this.active=false;if(this.source){this.source.onended=null;try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}for(const t of [...this.ticks])try{t.stop();}catch{}this.ticks=[];}
 setVolume(music,effects){this.volume=music;this.effects=effects;if(this.context){this.master.gain.setTargetAtTime(music,this.context.currentTime,.04);this.fx.gain.setTargetAtTime(effects,this.context.currentTime,.04);}}
}
