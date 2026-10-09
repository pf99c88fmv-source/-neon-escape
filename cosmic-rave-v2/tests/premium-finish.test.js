import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {course,Run,SPB,DURATION,isPickup,SPECIAL_POINTS} from '../src/course.js';

const code=file=>readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
test('every in-game collectible is one of three premium rewards; no golden spheres',()=>{
 const events=course();
 const kinds=['dancer','bottle','cash'];
 const pickups=events.filter(e=>isPickup(e.kind));
 assert.ok(pickups.length>260);
 assert.ok(pickups.every(e=>kinds.includes(e.kind)));
 assert.ok(!events.some(e=>e.kind==='orb'||e.kind==='shield'));
 for(const kind of kinds)assert.ok(pickups.filter(e=>e.kind===kind).length>80);
 assert.ok(pickups.every(e=>events.filter(w=>w.beat===e.beat&&!isPickup(w.kind))
  .every(w=>w.lane!==e.lane)));
});
test('all premium rewards earn the requested exact points once',()=>{
 for(const [kind,points] of Object.entries(SPECIAL_POINTS)){
  const r=new Run(),e=r.events.find(x=>x.kind===kind);
  for(const other of r.events)if(other.beat<e.beat)other.passed=true;
  r.x=e.x;r.target=e.x;r.beat=e.beat-.12;
  r.update(e.beat+.02,.02);
  assert.equal(r.score,points);
  assert.equal(r.feedback.filter(f=>f.type===kind).length,1);
  r.update(e.beat+.20,.02);
  assert.equal(r.feedback.filter(f=>f.type===kind).length,1);
 }
});
test('no collisions when following every safe reward across full VITTY track',()=>{
 for(const fps of [30,60]){
  const run=new Run();
  for(let t=0;t<DURATION*SPB;t+=1/fps){
   const next=run.events.find(e=>isPickup(e.kind)&&e.beat>run.beat);
   run.target=next?.x??0;run.update(t/SPB,1/fps);
  }
  run.update(DURATION,1/fps);
  assert.equal(run.health,3);
  assert.equal(run.done,true);
 }
});
test('four bottle shapes and detailed hollow rolled-dollar geometry exist',()=>{
 const source=code('club-collectibles.js');
 for(const type of ['whisky','vodka','champagne','cognac'])
  assert.match(source,new RegExp(type));
 assert.match(source,/function bottleTypeForEvent|export function bottleTypeForEvent/);
 assert.match(source,/ONE HUNDRED DOLLARS/);
 assert.match(source,/TorusGeometry\(r/);
 assert.match(source,/CylinderGeometry\(radius,radius,len,40,1,true\)/);
 assert.match(source,/PlaneGeometry\(tight\?/);
 assert.match(source,/computeVertexNormals/);
});
test('adult dancer is styled with light skin, stage bodysuit and tall boots',()=>{
 const avatar=code('club-collectibles.js'),show=code('rave-show.js');
 assert.match(avatar,/Light-toned skin/);
 assert.match(avatar,/vec3\(\.96,\.70,\.60\)/);
 assert.match(avatar,/bodice/);
 assert.match(avatar,/hotpants/);
 assert.match(avatar,/float boots/);
 assert.match(show,/styleNightclubDancer\(cloneSkinned/);
 assert.match(show,/dancerPlaceholder\(\)/);
 assert.match(show,/fair-skinned adult nightclub dancer|recognizable adult club performer/);
});
test('pickup model is event-seeded and cleans optional dancer resources',()=>{
 const show=code('rave-show.js'),world=code('world.js');
 assert.match(show,/makePickup\(kind,eventId=0\)/);
 assert.match(show,/bottleTypeForEvent\(eventId\)/);
 assert.match(show,/releasePickup\(group\)/);
 assert.match(world,/makePickup\(e\.kind,e\.id\)/);
 assert.doesNotMatch(world,/new T\.IcosahedronGeometry/);
 assert.match(show,/stageOwned/);
});
test('smooth tunnel uses advanced arch geometry and mobile-budget light atmosphere',()=>{
 const tunnel=code('tunnel.js'),fog=code('tunnel-atmosphere.js'),world=code('world.js');
 assert.match(tunnel,/archPoints\),88,\.12,10,false/);
 assert.match(tunnel,/magentaHalo/);
 assert.match(tunnel,/this\.materials\.halo\.opacity/);
 assert.match(fog,/const COLORS=\[/);
 assert.match(fog,/this\.halos\.length/);
 assert.match(fog,/dust|this\.points\.geometry/);
 assert.match(fog,/setQuality\(preset\)/);
 assert.match(world,/this\.atmosphere\.update\(beat,dt,travel,z\)/);
});
test('UI remains uncluttered and original VITTY audio stays selected',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const audio=code('audio.js');
 assert.doesNotMatch(html,/id="track-label"/);
 assert.match(html,/class="menu-brand">МАКАР/);
 assert.match(html,/src\/app\.js\?v=arcade-finish-2/);
 assert.match(audio,/makar-zhenya-soundtrack\.mp3/);
});
