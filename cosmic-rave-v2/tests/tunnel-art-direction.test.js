import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARCH_PROFILE,ROAD_HALF_WIDTH,FRAME_COUNT,FRAME_STEP,frameZ} from '../src/tunnel-layout.js';

const source=filename=>readFileSync(new URL('../src/'+filename,import.meta.url),'utf8');

test('oversized cheap torus rings have been removed from tunnel, portal and planets',()=>{
 for(const name of ['tunnel.js','world.js','cosmic-sky.js']){
  const src=source(name);
  assert.doesNotMatch(src,/new T\.TorusGeometry\(/,name+' still has geometric rings');
 }
 const world=source('world.js');
 assert.match(world,/vanishing point/);
 assert.match(world,/PlaneGeometry\(38,25\)/);
});

test('architectural six-bay rhythm breaks up identical repeating frames',()=>{
 const src=source('tunnel.js');
 assert.match(src,/const mode=i%6/);
 assert.match(src,/const hero=mode===0/);
 assert.match(src,/const bridge=mode===2/);
 assert.match(src,/const soft=mode===4/);
 assert.match(src,/CatmullRomCurve3\(archPoints\),90,\.19,10,false/);
 assert.ok(FRAME_COUNT>=18);
 assert.ok(FRAME_STEP>10);
});

test('all collision lanes remain unobstructed after corridor expansion',()=>{
 assert.equal(ROAD_HALF_WIDTH,4.8);
 assert.ok(ARCH_PROFILE[0][0] < -ROAD_HALF_WIDTH);
 assert.ok(ARCH_PROFILE.at(-1)[0] > ROAD_HALF_WIDTH);
 const tunnel=source('tunnel.js');
 assert.match(tunnel,/\[side\*7\.70,2\.4,zMid\]/);
 assert.match(tunnel,/\[side\*5\.60,3\.67,zMid\]/);
 for(let i=0;i<FRAME_COUNT;i++)
  assert.ok(Number.isFinite(frameZ(i,137.21)));
});

test('tunnel floor and wall shaders support instancing and smooth musical tints',()=>{
 const tunnel=source('tunnel.js');
 assert.match(tunnel,/instanceMatrix\*p/);
 assert.match(tunnel,/this\.zoneColors=/);
 assert.match(tunnel,/this\.materials\.floor\.uniforms\.uTint\.value\.lerp/);
 assert.match(tunnel,/this\.materials\.holo\.uniforms\.uTint\.value\.lerp/);
 assert.match(tunnel,/color\+=vec3\(\.025,\.035,\.07\)/);
});

test('mobile-quality renderer keeps bloom restrained and retains lower quality fallback',()=>{
 const world=source('world.js');
 assert.match(world,/\.33,\.58,1\.08/);
 assert.match(world,/q==='low'\?1/);
 assert.match(world,/Math\.min\(devicePixelRatio,1\.65\)/);
 assert.match(world,/this\.atmosphere\.setQuality\(q\)/);
 assert.match(world,/this\.show\.setQuality\(q\)/);
});

test('new visuals do not replace original music, pickups or pause controls',()=>{
 const world=source('world.js');
 const app=source('app.js');
 const audio=source('audio.js');
 const course=source('course.js');
 assert.match(world,/this\.show\.makePickup\(e\.kind,e\.id\)/);
 assert.match(app,/world\.js\?v=cathedral-2/);
 assert.match(app,/audio\.pause\(\)/);
 assert.match(audio,/makar-zhenya-soundtrack\.mp3/);
 assert.match(course,/variants\[i%variants\.length\]/);
});
