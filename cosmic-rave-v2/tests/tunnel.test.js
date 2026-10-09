import test from 'node:test';
import assert from 'node:assert/strict';
import {
 FRAME_COUNT,FRAME_STEP,FRAME_SPAN,NEAR_Z,ROAD_HALF_WIDTH,
 ARCH_PROFILE,frameZ,archSideClearance
} from '../src/tunnel-layout.js';
test('architecture uses exactly twenty uniformly spaced bays',()=>{
 assert.equal(FRAME_COUNT,20);
 assert.ok(FRAME_STEP>11);
 for(let i=0;i<FRAME_COUNT-1;i++)
  assert.ok(Math.abs(frameZ(i,0)-frameZ(i+1,0)-FRAME_STEP)<1e-8);
});
test('all structural bays share the same forward travel',()=>{
 for(let i=0;i<FRAME_COUNT;i++){
  assert.ok(Math.abs(frameZ(i,0)-frameZ(i,FRAME_SPAN))<1e-8);
 }
 assert.ok(frameZ(3,10)>frameZ(3,0));
 assert.equal(frameZ(0,0),NEAR_Z);
});
test('clearance around the running character and track',()=>{
 assert.ok(archSideClearance(1.3)>ROAD_HALF_WIDTH);
 assert.ok(archSideClearance(2.1)>ROAD_HALF_WIDTH);
 assert.ok(ARCH_PROFILE[5][1]>8.5);
});
test('frame position is always finite, even after many loops',()=>{
 for(const b of [0,100,230,1000,12000]){
  for(let i=0;i<FRAME_COUNT;i++){
   const z=frameZ(i,b);
   assert.ok(Number.isFinite(z)&&z<=NEAR_Z&&z>NEAR_Z-FRAME_SPAN);
  }
 }
});
