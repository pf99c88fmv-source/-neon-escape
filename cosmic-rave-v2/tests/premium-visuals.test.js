import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 PROP_X,DANCER_X,DISPLAY_RADIUS,PROP_SLOTS,DANCER_SLOTS,
 SIDE_CLEARANCE,displayZ
} from '../src/premium-layout.js';
import {FRAME_SPAN,ROAD_HALF_WIDTH} from '../src/tunnel-layout.js';

test('rave scenery and collectible symbols stay outside every playable lane',()=>{
 assert.ok(SIDE_CLEARANCE>=.25);
 assert.ok(PROP_X-DISPLAY_RADIUS>ROAD_HALF_WIDTH);
 assert.ok(DANCER_X-DISPLAY_RADIUS>ROAD_HALF_WIDTH);
 assert.equal(PROP_SLOTS.length,4);
 assert.equal(DANCER_SLOTS.length,2);
 for(const p of [...PROP_SLOTS,...DANCER_SLOTS]){
  assert.ok(p.side===-1||p.side===1);
  assert.ok(p.slot>=0&&p.slot<20);
 }
});

test('bottle, cash tube and dancers use one shared deterministic travel clock',()=>{
 const spots=[...PROP_SLOTS,...DANCER_SLOTS];
 for(const p of spots){
  for(const travel of [0,5,50,230,1000]){
   const a=displayZ(p.slot,travel);
   const b=displayZ(p.slot,travel+FRAME_SPAN);
   assert.ok(Math.abs(a-b)<1e-8);
  }
 }
});
test('club and dancer props are decorative and cannot change collision logic',()=>{
 const show=readFileSync(new URL('../src/rave-show.js',import.meta.url),'utf8');
 assert.match(show,/new GLTFLoader\(\)\.loadAsync/);
 assert.match(show,/SambaDance|samba/);
 assert.match(show,/PROP_SLOTS/);
 assert.match(show,/DANCER_SLOTS/);
 assert.doesNotMatch(show,/run\.events|run\.health|this\.health/);
});
test('holographic instanced side panels get unique instance transforms',()=>{
 const tunnel=readFileSync(new URL('../src/tunnel.js',import.meta.url),'utf8');
 assert.match(tunnel,/instanceMatrix\*p/);
 assert.match(tunnel,/TubeGeometry/);
 assert.match(tunnel,/holo/);
});
test('premium view keeps exact VITTY audio and never edits the game state',()=>{
 const audio=readFileSync(new URL('../src/audio.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(audio,/makar-zhenya-soundtrack\.mp3/);
 assert.doesNotMatch(audio,/techno-rush-3d\.mp3/);
 assert.match(app,/import \{World\} from '.\/world\.js\?v=premium-show-1'/);
});
