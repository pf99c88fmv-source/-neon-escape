import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BPM,DURATION,SPB,zones,zoneAt,course} from '../src/course.js';

const manifest=JSON.parse(readFileSync(new URL('../assets/audio/vitty-track.json',import.meta.url),'utf8'));
test('the VITTY audio is the exact file supplied for this project',()=>{
 const bytes=readFileSync(new URL('../../makar-zhenya-soundtrack.mp3',import.meta.url));
 const sha=createHash('sha256').update(bytes).digest('hex');
 assert.equal(sha,manifest.sha256);
 assert.equal(manifest.title,'VITTY — Out Of My Mind (Original Mix)');
 assert.ok(bytes.byteLength>3_000_000);
});
test('beat grid and game length match the VITTY soundtrack',()=>{
 assert.equal(BPM,manifest.bpm);
 assert.equal(DURATION,manifest.beats);
 assert.ok(Math.abs(DURATION*SPB-manifest.duration)<.2);
 assert.deepEqual(zones.map(z=>z.start),manifest.sections.map(s=>s.beat));
 for(let i=0;i<zones.length;i++)assert.equal(zoneAt(zones[i].start),i);
});
test('course has gameplay across all four zones, until the soundtrack ends',()=>{
 const events=course();
 for(let i=0;i<zones.length;i++){
  const start=zones[i].start,end=zones[i+1]?.start??DURATION;
  assert.ok(events.some(e=>e.beat>=start&&e.beat<end));
 }
 assert.ok(events.every(e=>e.beat<DURATION));
});
