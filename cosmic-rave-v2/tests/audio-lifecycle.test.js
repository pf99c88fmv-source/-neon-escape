import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from '../src/audio.js';
import {SPB} from '../src/course.js';
function fixture(){
 const sources=[],audio=new AudioEngine();
 const context={
  state:'running',currentTime:10,
  createBufferSource(){
   const source={
    connect(){},disconnect(){this.disconnected=true;},
    start(...args){this.started=args;},stop(){this.stopped=true;}
   };
   sources.push(source);return source;
  }
 };
 audio.context=context;audio.master={};audio.buffer={};
 audio.tick=()=>{};
 return {audio,context,sources};
}
test('iOS AudioContext suspension leaves gameplay beat monotonic',()=>{
 const {audio,context}=fixture();
 audio.start();
 context.state='suspended';
 audio.perfStartAt=performance.now()-3*SPB*1000;
 assert.ok(Math.abs(audio.beat()-3)<.1);
 assert.equal(audio.remainingCountIn(),0);
 assert.ok(audio.transport()>2.9);
});
test('touch after suspension restarts the soundtrack at current beat',async()=>{
 const {audio,context,sources}=fixture();
 audio.start();
 context.state='suspended';
 audio.perfStartAt=performance.now()-3*SPB*1000;
 context.resume=async()=>{context.state='running';};
 assert.equal(await audio.recover(),true);
 assert.equal(sources.length,2);
 assert.equal(sources[0].stopped,true);
 assert.equal(sources[0].disconnected,true);
 assert.ok(Math.abs(sources[1].started[1]-3*SPB)<.1);
});
test('suspension during countdown recovers into fresh count-in',async()=>{
 const {audio,context,sources}=fixture();
 audio.start();
 context.state='interrupted';
 context.resume=async()=>{context.state='running';};
 assert.equal(await audio.recover(),true);
 assert.equal(sources.length,2);
 assert.ok(Math.abs(sources[1].started[0]-(context.currentTime+4*SPB))<.01);
});
test('transport stays based on audio clock while actually running',()=>{
 const {audio,context}=fixture();
 audio.start();
 context.currentTime+=4*SPB+8*SPB;
 assert.ok(Math.abs(audio.pause()-8)<1e-8);
});
