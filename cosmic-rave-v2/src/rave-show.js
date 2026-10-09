import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {PROP_X,DANCER_X,PROP_SLOTS,DANCER_SLOTS,displayZ} from './premium-layout.js';
import {
 BOTTLE_TYPES,bottleTypeForEvent,makeBottleLabelTexture,makePremiumBottle,
 makeBanknoteTexture,makeRolledBanknote,styleNightclubDancer
} from './club-collectibles.js?v=arcade-finish-2';

const FESTIVAL_DANCER_URL='https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb';
function part(group,geometry,material,x=0,y=0,z=0){
 const o=new T.Mesh(geometry,material);o.position.set(x,y,z);group.add(o);return o;
}
function material(color,metalness=.3,roughness=.35){
 return new T.MeshStandardMaterial({color,metalness,roughness});
}
function pedestal(color=0x25d5ef){
 const g=new T.Group();
 const dark=material(0x0e1228,.85,.25);
 part(g,new T.CylinderGeometry(1.48,1.58,.24,40),dark,0,-.11,0);
 const torus=new T.TorusGeometry(1.48,.055,6,40);
 const ring=part(g,torus,new T.MeshBasicMaterial({color}),0,.03,0);
 ring.rotation.x=Math.PI/2;
 part(g,new T.CylinderGeometry(1.33,1.33,.015,40),material(0x24334e,.72,.28),0,.02,0);
 return g;
}
function spotlightPod(kind,labels,dollar,seed=0){
 // Cash is suspended in the air; a floor pedestal made it look embedded.
 const g=kind==='cash'?new T.Group():pedestal(0xffba67);
 const type=bottleTypeForEvent(seed);
 const model=kind==='bottle'?makePremiumBottle(type,labels[type]):makeRolledBanknote(dollar,seed);
 if(kind==='bottle'){model.scale.setScalar(1.13);model.position.y=.16;}
 else{model.scale.setScalar(1.20);model.position.y=2.18;}
 g.add(model);
 if(kind!=='cash'){
  const rim=part(g,new T.TorusGeometry(1.16,.035,5,32),
   new T.MeshBasicMaterial({color:0xd19c55}),0,.12,0);
  rim.rotation.x=Math.PI/2;
 }
 g.userData.animated=model;
 return g;
}
export class RaveShow{
 constructor(scene){
  this.scene=scene;this.dancers=[];this.pods=[];this.ready=false;this.minimal=false;
  this.pendingPickupDancers=new Set();this.activePickupDancers=new Set();this.dancerAsset=null;
  this.bottleLabels=Object.fromEntries(BOTTLE_TYPES.map(k=>[k,makeBottleLabelTexture(k)]));
  this.banknoteTexture=makeBanknoteTexture();
  for(const spec of PROP_SLOTS){
   const group=spotlightPod(spec.kind,this.bottleLabels,this.banknoteTexture,spec.slot);
   scene.add(group);this.pods.push({...spec,group});
  }
  // GLB is an optional independent decoration: network failure must never
  // prevent the main game from launching, playing music or controlling the hero.
  this.loadDancers();
 }
 async loadDancers(){
  try{
   const gltf=await new GLTFLoader().loadAsync(FESTIVAL_DANCER_URL);
   this.dancerAsset=gltf;
   const clip=gltf.animations.find(c=>/samba|dance/i.test(c.name))||gltf.animations[0];
   if(!clip)throw Error('The sample has no dance animation');
   for(const spec of DANCER_SLOTS){
    const stage=pedestal(spec.side<0?0xff55c2:0x38f8f3);
    stage.visible=!this.minimal||spec.side<0;
    this.scene.add(stage);
    const person=styleNightclubDancer(cloneSkinned(gltf.scene));
    // Pose first, then normalize bounds: prevents the oversized-boot problem
    // that an earlier character demonstration showed on iPhone.
    const mixer=new T.AnimationMixer(person);
    const action=mixer.clipAction(clip);action.play();mixer.update(.04);
    person.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(person);
    const height=Math.max(.001,bounds.max.y-bounds.min.y);
    const factor=2.65/height;
    person.scale.multiplyScalar(factor);
    person.position.set(
     -(bounds.min.x+bounds.max.x)*.5*factor,
     .15-bounds.min.y*factor,
     -(bounds.min.z+bounds.max.z)*.5*factor
    );
    person.rotation.y=spec.side<0?.30:-.30;
    person.traverse(o=>{
     if(o.isMesh){
      o.frustumCulled=false;
      // Preserve genuine model textures and its skin weighting.
      if(o.material?.isMeshStandardMaterial){
       o.material=o.material.clone();
       o.material.roughness=Math.min(.8,o.material.roughness??.5);
      }
     }
    });
    stage.add(person);
    this.dancers.push({...spec,stage,person,mixer,action});
   }
   this.ready=true;
   for(const pickup of [...this.pendingPickupDancers])this.activateDancerPickup(pickup);
   this.pendingPickupDancers.clear();
  }catch(error){
   // A missing third-party character resource must not crash gameplay.
   this.failed=true;
   console.warn('Rave dancer GLB unavailable; continuing without optional NPCs:',error);
  }
 }
 // The user-facing collectible has its own 3D geometry and reward. The
 // separate scenery pods remain purely decorative and never score points.
 makePickup(kind,eventId=0){
  const group=new T.Group();
  group.userData.kind=kind;group.userData.eventId=eventId;
  const highlight=kind==='dancer'?0xff5ecc:kind==='cash'?0x5bfca7:0xffc56b;
  // Leave cash fully floating: its ring/pedestal sat at floor level and
  // visually concealed the rolled banknote. Other pickups keep their stage.
  if(kind!=='cash'){
   part(group,new T.CylinderGeometry(.89,.96,.13,24),
    new T.MeshStandardMaterial({color:0x11192c,metalness:.75,roughness:.28}),0,.11,0);
   const aura=part(group,new T.TorusGeometry(.9,.052,7,28),
    new T.MeshBasicMaterial({color:highlight}),0,.2,0);
   aura.rotation.x=Math.PI/2;
  }
  if(kind==='bottle'){
   const type=bottleTypeForEvent(eventId);
   group.userData.bottleType=type;
   const item=makePremiumBottle(type,this.bottleLabels[type]);
   item.scale.setScalar(type==='cognac'?.92:.97);
   item.position.y=.2;
   group.add(item);
  }else if(kind==='cash'){
   const item=makeRolledBanknote(this.banknoteTexture,eventId);
   item.scale.setScalar(1.25);
   // makeRolledBanknote supplies y=1.46 by default. Do not crush the
   // whole banknote back into the floor by overriding with y=.24.
   // The tilted tube has nearly one unit of vertical extent.
   item.position.y=2.20;
   group.add(item);
  }else if(kind==='dancer'){
   // The clear costume-shaped fallback is shown only until the skinned GLB
   // loads; once available this is replaced with real skeletal animation.
   const placeholder=this.dancerPlaceholder();
   group.add(placeholder);
   group.userData.placeholder=placeholder;
   if(this.dancerAsset)this.activateDancerPickup(group);
   else this.pendingPickupDancers.add(group);
  }
  return group;
 }
 dancerPlaceholder(){
  // Drawn fallback is deliberately a recognizable adult club performer,
  // never a black placeholder, if the optional GLB download is blocked.
  const canvas=document.createElement('canvas');
  canvas.width=384;canvas.height=576;
  const g=canvas.getContext('2d');
  if(g){
   const skin='#f2c4aa',hair='#edbb72',dress='#db248e',trim='#4ff7ff';
   g.save();g.lineCap='round';g.lineJoin='round';
   g.shadowColor='#fb58b8';g.shadowBlur=24;
   // Hair behind both shoulders, extending below her stage bodice.
   g.fillStyle=hair;g.beginPath();
   g.moveTo(158,102);g.bezierCurveTo(112,101,106,144,109,221);
   g.bezierCurveTo(100,266,96,283,112,296);
   g.bezierCurveTo(137,283,142,262,165,247);
   g.lineTo(215,247);g.bezierCurveTo(253,282,271,293,277,281);
   g.bezierCurveTo(268,235,285,160,251,111);
   g.closePath();g.fill();
   // Long dancing legs and ankle boots.
   g.strokeStyle=skin;g.lineWidth=29;g.beginPath();
   g.moveTo(169,304);g.lineTo(153,385);g.lineTo(126,447);
   g.moveTo(216,304);g.lineTo(244,388);g.lineTo(255,448);g.stroke();
   g.strokeStyle='#291238';g.lineWidth=35;g.beginPath();
   g.moveTo(126,423);g.lineTo(116,484);
   g.moveTo(256,423);g.lineTo(270,484);g.stroke();
   g.strokeStyle=trim;g.lineWidth=7;g.beginPath();
   g.moveTo(112,461);g.lineTo(130,460);
   g.moveTo(256,459);g.lineTo(272,458);g.stroke();
   // Raised stage arms and exposed shoulders.
   g.strokeStyle=skin;g.lineWidth=26;g.beginPath();
   g.moveTo(155,174);g.lineTo(102,212);g.lineTo(64,146);
   g.moveTo(231,174);g.lineTo(288,139);g.lineTo(308,93);g.stroke();
   // Pink club bodysuit with stylized corset waist and reflective seams.
   g.fillStyle=dress;g.beginPath();
   g.moveTo(159,173);g.quadraticCurveTo(192,189,226,173);
   g.lineTo(240,228);g.lineTo(222,295);g.lineTo(158,295);
   g.lineTo(143,228);g.closePath();g.fill();
   g.fillStyle='#87206c';g.fillRect(162,281,59,22);
   g.strokeStyle=trim;g.lineWidth=6;g.beginPath();
   g.moveTo(156,198);g.lineTo(191,219);g.lineTo(227,198);
   g.moveTo(164,258);g.lineTo(220,258);g.stroke();
   // Fair-skinned face with shaded jaw and bright features.
   g.fillStyle=skin;g.beginPath();g.ellipse(193,130,42,55,-.03,0,Math.PI*2);g.fill();
   g.fillStyle='#efbd93';g.beginPath();g.ellipse(193,175,15,13,0,0,Math.PI*2);g.fill();
   g.fillStyle=hair;g.beginPath();
   g.moveTo(150,128);g.bezierCurveTo(143,65,236,44,251,111);
   g.bezierCurveTo(228,109,221,78,213,75);
   g.bezierCurveTo(209,111,184,95,150,128);g.fill();
   g.shadowBlur=0;
   g.fillStyle='#242842';g.beginPath();g.arc(177,129,4.5,0,Math.PI*2);
   g.arc(211,129,4.5,0,Math.PI*2);g.fill();
   g.fillStyle='#e45086';g.fillRect(184,156,19,4);
   g.strokeStyle='#f4d6f1';g.lineWidth=4;g.beginPath();g.moveTo(163,179);g.lineTo(158,200);
   g.moveTo(223,179);g.lineTo(232,199);g.stroke();
   g.restore();
  }
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  sprite.position.set(0,1.51,0);sprite.scale.set(2.0,2.93,1);
  return sprite;
 }
 activateDancerPickup(group){
  if(!this.dancerAsset||!group||group.userData.disposed)return;
  try{
   const asset=this.dancerAsset,clip=asset.animations.find(a=>/samba|dance/i.test(a.name))||asset.animations[0];
   if(!clip)return;
   const person=styleNightclubDancer(cloneSkinned(asset.scene));
   const mixer=new T.AnimationMixer(person);
   const action=mixer.clipAction(clip);action.play();mixer.update(.03);
   person.updateMatrixWorld(true);
   const bbox=new T.Box3().setFromObject(person);
   const height=Math.max(.001,bbox.max.y-bbox.min.y);
   const scale=2.63/height;
   person.scale.setScalar(scale);
   person.position.set(
    -(bbox.min.x+bbox.max.x)*.5*scale,
    .25-bbox.min.y*scale,
    -(bbox.min.z+bbox.max.z)*.5*scale
   );
   person.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});
   if(group.userData.placeholder){
    const sprite=group.userData.placeholder;
    group.remove(sprite);
    sprite.material.map?.dispose();
    sprite.material.dispose();
    group.userData.placeholder=null;
   }
   group.add(person);
   group.userData.dancerPerson=person;
   group.userData.dancerMixer=mixer;
   group.userData.dancerAction=action;
   this.activePickupDancers.add(group);
  }catch(e){console.warn('Optional collectible dancer skin failed',e);}
 }
 releasePickup(group){
  if(!group||!group.userData?.specialModel)return;
  const pickup=group.userData.specialModel;
  if(pickup.userData.disposed)return;
  pickup.userData.disposed=true;
  this.pendingPickupDancers.delete(pickup);
  this.activePickupDancers.delete(pickup);
  pickup.userData.dancerAction?.stop();
  const sharedSkinMeshes=new Set();
  pickup.userData.dancerPerson?.traverse(o=>{if(o.isMesh)sharedSkinMeshes.add(o);});
  // The GLB's geometry is shared but the individual costume shader is not.
  pickup.traverse(o=>{
   if(sharedSkinMeshes.has(o)){
    for(const m of (Array.isArray(o.material)?o.material:[o.material]))
     if(m?.userData?.stageOwned)m.dispose();
    return;
   }
   if(o.isSprite){
    o.material?.map?.dispose();
    o.material?.dispose();
   }else if(o.isMesh){
    o.geometry?.dispose();
    if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());
    else o.material?.dispose();
   }
  });
 }
 setQuality(preset){
  this.minimal=preset==='low';
  for(const d of this.dancers)d.stage.visible=!this.minimal||d.side<0;
  for(const p of this.pods)p.group.visible=!this.minimal||p.slot%2===0;
 }
 update(beat,dt,travel){
  for(const obj of this.activePickupDancers){
   if(!obj.userData.disposed)obj.userData.dancerMixer.update(Math.min(Math.max(dt,0),.05));
  }
  const pulse=Math.exp(-(beat%1)*9);
  for(const pod of this.pods){
   pod.group.position.set(pod.side*PROP_X,.14,displayZ(pod.slot,travel,6.0));
   pod.group.rotation.y=Math.sin(beat*.08+pod.slot)*.08;
   pod.group.userData.animated.rotation.y+=Math.min(dt,.05)*.30;
   pod.group.scale.setScalar(1+pulse*.012);
  }
  for(const d of this.dancers){
   d.stage.position.set(d.side*DANCER_X,.12,displayZ(d.slot,travel,5.2));
   if(d.stage.visible)d.mixer.update(Math.min(dt,.05));
   d.action.timeScale=1.0;
   d.stage.rotation.y=Math.sin(beat*.075+d.slot)*.07;
  }
 }
}
