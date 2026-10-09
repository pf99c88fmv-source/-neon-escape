import test from 'node:test';import assert from 'node:assert/strict';import {course,depth,Run,SPB,DURATION,BPM,zones,zoneAt} from '../src/course.js';
test('obstacles approach from negative Z and cross the runner once',()=>{assert.ok(depth(16,12)<depth(16,14));assert.ok(Math.abs(depth(16,16))<1e-9);assert.ok(depth(16,17)>0);});
test('every gate has a reachable safe lane',()=>{const events=course();let previous=0,lastBeat=0;for(const orb of events.filter(x=>x.kind==='orb'||x.kind==='shield')){const walls=events.filter(x=>x.beat===orb.beat&&x.kind!=='orb'&&x.kind!=='shield');assert.equal(walls.length,2);assert.ok(walls.every(x=>x.lane!==orb.lane));assert.ok(Math.abs(orb.x-previous)<(orb.beat-lastBeat)*SPB*12-1);previous=orb.x;lastBeat=orb.beat;}});
test('route can be completed at 30 and 60 FPS without damage',()=>{for(const fps of [30,60]){const r=new Run();for(let t=0;t<DURATION*SPB;t+=1/fps){const next=r.events.find(x=>(x.kind==='orb'||x.kind==='shield')&&x.beat>r.beat);r.target=next?.x||0;r.update(t/SPB,1/fps);}assert.equal(r.health,3);assert.ok(r.score>1000);}});
test('misses cause damage once with recovery, restart is clean',()=>{const r=new Run();r.target=2.4;for(let t=0;t<13*SPB;t+=1/60)r.update(t/SPB,1/60);assert.equal(r.health,2);assert.ok(r.invulnerable>13);const fresh=new Run();assert.equal(fresh.health,3);assert.equal(fresh.score,0);assert.ok(fresh.events.every(e=>!e.passed));});
test('zen cannot die',()=>{const r=new Run(true);for(let t=0;t<(DURATION+1)*SPB;t+=1/30)r.update(t/SPB,1/30);assert.equal(r.health,3);assert.equal(r.done,true);});

test('VITTY course is synced to the full user soundtrack',()=>{
 assert.equal(BPM,132);assert.equal(DURATION,724);
 assert.ok(Math.abs(DURATION*SPB-329.169)<.3);
 assert.deepEqual(zones.map(z=>z.start),[0,181,362,543]);
 for(let i=0;i<4;i++)assert.equal(zoneAt(zones[i].start),i);
});
