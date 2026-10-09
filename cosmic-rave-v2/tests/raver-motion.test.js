import test from 'node:test';
import assert from 'node:assert/strict';
import {groovePose,danceIntensity,selectRunAnimation,pulse} from '../src/raver-motion.js';
test('rhythmic offsets are finite and deterministic across VITTY beats',()=>{
 for(const beat of [0,.125,.5,1,15.5,16,181,362,543,723]){
  const p=groovePose(beat,true,24,false);
  assert.ok(Object.values(p).every(Number.isFinite));
  assert.deepEqual(p,groovePose(beat,true,24,false));
  assert.ok(Math.abs(p.spineY)<=.2);
 }
});
test('injury never adds extra dance offsets',()=>{
 assert.equal(danceIntensity(32,true,30,true),0);
 const p=groovePose(32,true,30,true);
 assert.equal(p.leftArmZ,0);
 assert.equal(p.spineY,0);
 assert.equal(p.bob,0);
});
test('unobstructed running has visible beat groove and stronger combo flourishes',()=>{
 const first=groovePose(2.25,true,0,false);
 const combo=groovePose(2.25,true,32,false);
 assert.ok(combo.intensity>first.intensity);
 assert.ok(Math.abs(combo.leftShoulderX)>Math.abs(first.leftShoulderX));
 assert.ok(pulse(0)>pulse(.5));
});
test('run clip changes only at hyperdrive and transitions safely from a hit',()=>{
 assert.equal(selectRunAnimation(40,true,false,-1,null,543),'Jog_Fwd_Loop');
 assert.equal(selectRunAnimation(543,true,false,-1,null,543),'Sprint_Loop');
 assert.equal(selectRunAnimation(100,true,true,101,null,543),'Hit_Chest');
 assert.equal(selectRunAnimation(101,true,false,103,null,543),'Hit_Chest');
 assert.equal(selectRunAnimation(9,false,false,-1,null,543),'Dance_Loop');
 assert.equal(selectRunAnimation(20,true,false,-1,'Death01',543),'Death01');
});
