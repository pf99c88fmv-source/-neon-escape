import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Run,course,isPickup,SPECIAL_POINTS,pickupPoints} from '../src/course.js';
const source=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('female dancer, bottle and dollar cash tube spawn visibly on safe lanes',()=>{
 const track=course(),types=Object.keys(SPECIAL_POINTS);
 for(const type of types){
  const rewards=track.filter(e=>e.kind===type);
  assert.ok(rewards.length>=5,'Not enough '+type+' collectibles');
  for(const r of rewards){
   assert.equal(track.filter(e=>e.beat===r.beat&&isPickup(e.kind)).length,1);
   assert.ok(track.filter(e=>e.beat===r.beat&&!isPickup(e.kind)).every(x=>x.lane!==r.lane));
  }
 }
 assert.deepEqual(types.map(type=>pickupPoints(type,4)),[300,200,250]);
});

test('each item awards exact reward only one time',()=>{
 for(const type of Object.keys(SPECIAL_POINTS)){
  const run=new Run(),item=run.events.find(e=>e.kind===type);
  for(const event of run.events)if(event.beat<item.beat)event.passed=true;
  run.x=item.x;run.target=item.x;run.beat=item.beat-.12;
  run.update(item.beat+.02,.02);
  assert.equal(run.score,SPECIAL_POINTS[type]);
  assert.equal(run.feedback.filter(f=>f.type===type).length,1);
  run.update(item.beat+.22,.02);
  assert.equal(run.feedback.filter(f=>f.type===type).length,1);
 }
});

test('3D lane render and cleanup are wired into the world without changing collider geometry',()=>{
 const show=source('src/rave-show.js'),world=source('src/world.js');
 assert.match(show,/makePickup\(kind\)/);
 assert.match(show,/activateDancerPickup/);
 assert.match(show,/releasePickup\(group\)/);
 assert.match(show,/SpriteMaterial/);
 assert.match(show,/cloneSkinned/);
 assert.match(world,/this\.show\.makePickup\(e\.kind\)/);
 assert.match(world,/this\.show\.releasePickup\(o\)/);
 assert.match(world,/isPickup\(e\.kind\)/);
 assert.doesNotMatch(show,/run\.score\s*=|run\.health\s*=/);
});

test('user interface features a large title but no persistent song badge',()=>{
 const html=source('index.html'),css=source('style.css'),app=source('src/app.js');
 assert.match(html,/class="menu-brand">МАКАР/);
 assert.match(html,/id="brand">МАКАР/);
 assert.match(css,/\.menu-brand/);
 assert.match(css,/#brand\{\s*font-size:clamp/);
 assert.doesNotMatch(html,/id="track-label"/);
 assert.doesNotMatch(app,/#track-label/);
 assert.match(app,/RAVE GIRL \+300/);
 assert.match(app,/WHISKY \+200/);
 assert.match(app,/DOLLAR ROLL \+250/);
});

test('VITTY audio remains selected and no public branch was touched',()=>{
 const audio=source('src/audio.js');
 assert.match(audio,/makar-zhenya-soundtrack\.mp3/);
 assert.doesNotMatch(audio,/techno-rush-3d\.mp3/);
});
