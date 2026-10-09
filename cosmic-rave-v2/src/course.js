export const BPM=132,SPB=60/BPM,DURATION=724,SPEED=24,LANES=[-2.4,0,2.4];
export const zones=[{name:'NEON WORMHOLE',start:0,color:0x20dcff,accent:0x883dff},{name:'TECHNO CATHEDRAL',start:181,color:0xaa65ff,accent:0xff349d},{name:'GALACTIC RAVE',start:362,color:0x3cf5c1,accent:0x268fff},{name:'HYPERSPACE DROP',start:543,color:0xff4aad,accent:0xffcb65}];
export function zoneAt(beat){return Math.min(3,Math.max(0,Math.floor(beat/181)));}
export function depth(arrival,beat){return -(arrival-beat)*SPB*SPEED;}
export const SPECIAL_POINTS=Object.freeze({dancer:300,bottle:200,cash:250});
export const SPECIAL_NAMES=Object.freeze({dancer:'RAVE GIRL',bottle:'BOTTLE',cash:'DOLLAR ROLL'});
export function isPickup(kind){return Object.hasOwn(SPECIAL_POINTS,kind);}
export function pickupPoints(kind,multiplier=1){return SPECIAL_POINTS[kind]??0;}
// Special collectibles replace existing safe-lane orbs; they never create
// an additional obstacle and never block the only traversable lane.
export function course(){
 const events=[];let i=0;
 const route=[1,0,1,2,1,0,0,1,2,2,1,0];
 const variants=['dancer','bottle','cash'];
 for(let beat=12;beat<DURATION;beat+=beat<362?4:2){
  const safe=route[i%route.length];
  for(let lane=0;lane<3;lane++){
   if(lane!==safe)events.push({
    id:events.length,beat,lane,x:LANES[lane],
    kind:i%3===0?'laser':i%3===1?'wall':'shard'
   });
  }
  // Every reward is now a clearly identifiable club collectible, with no
  // legacy glowing spheres or old shield pickups on the track.
  const kind=variants[i%variants.length];
  events.push({id:events.length,beat,x:LANES[safe],lane:safe,kind});
  i++;
 }
 return events;
}
export class Run{
 constructor(zen=false){this.zen=zen;this.events=course();this.x=0;this.target=0;this.beat=0;this.score=0;this.combo=0;this.health=3;this.shield=false;this.invulnerable=0;this.feedback=[];this.done=false;this.perfect=0;this.dodged=0;}
 get multiplier(){return Math.min(5,1+Math.floor(this.combo/8));}
 update(beat,dt){if(this.done)return;const before=this.x,old=this.beat;this.x+=Math.max(-12*dt,Math.min(12*dt,this.target-this.x));this.beat=beat;
 for(const e of this.events){if(e.passed||beat<e.beat-.08)continue;const t=beat===old?1:Math.max(0,Math.min(1,(e.beat-old)/(beat-old)));const x=before+(this.x-before)*t;
 if(isPickup(e.kind)){
  if(beat>=e.beat){
   e.passed=true;
   if(Math.abs(e.x-x)<.9){
    this.combo++;
    const points=pickupPoints(e.kind,this.multiplier);
    this.score+=points;
    if(e.kind==='shield')this.shield=true;
    this.feedback.push({type:e.kind,x:e.x,points});
   }
  }
 }
 else {const half=.07;if(old<=e.beat+half&&beat>=e.beat-half){const span=beat-old;const start=span>0?Math.max(0,(e.beat-half-old)/span):0,end=span>0?Math.min(1,(e.beat+half-old)/span):1;const xa=before+(this.x-before)*start,xb=before+(this.x-before)*end;const overlaps=Math.max(xa,xb)>e.x-1.03&&Math.min(xa,xb)<e.x+1.03;if(overlaps&&!e.hit&&!this.zen&&beat>this.invulnerable){e.hit=true;if(this.shield)this.shield=false;else this.health--;this.combo=0;this.invulnerable=beat+3;this.feedback.push({type:'hit',x});if(this.health<=0)this.done=true;}}
 if(beat>e.beat+half){e.passed=true;if(!e.hit){this.score+=20*this.multiplier;this.dodged++;}}}

 }
 if(beat>=DURATION)this.done=true;
 }
}
