import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {PROP_X,DANCER_X,PROP_SLOTS,DANCER_SLOTS,displayZ} from './premium-layout.js';
import {
 BOTTLE_TYPES,bottleTypeForEvent,makeBottleLabelTexture,makePremiumBottle,
 makeBanknoteTexture,makeRolledBanknote,styleNightclubDancer
} from './club-collectibles.js';

const FESTIVAL_DANCER_URL='https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb';
const v=(x,y,z)=>new T.Vector3(x,y,z);
function part(group,geometry,material,x=0,y=0,z=0){
 const o=new T.Mesh(geometry,material);o.position.set(x,y,z);group.add(o);return o;
}
function material(color,metalness=.3,roughness=.35){
 return new T.MeshStandardMaterial({color,metalness,roughness});
}
function canvasTexture(kind){
 const c=document.createElement('canvas');c.width=1024;c.height=512;
 const g=c.getContext('2d');
 if(!g)return null;
 if(kind==='dollar'){
  g.fillStyle='#4b8c56';g.fillRect(0,0,1024,512);
  for(let y=0;y<512;y+=5){g.fillStyle=y%10?'#6da876':'#45814d';g.fillRect(0,y,1024,2);}
  g.lineWidth=14;g.strokeStyle='#e4e9bc';g.strokeRect(21,20,982,470);
  g.lineWidth=3;g.strokeStyle='#214c2c';
  for(let x=65;x<1024;x+=220){
   g.save();g.translate(x,256);g.rotate(-.08);
   g.strokeRect(-28,-173,185,344);
   g.fillStyle='#e5eabe';g.fillRect(-5,-143,140,286);
   g.fillStyle='#194c31';g.font='bold 105px Georgia,serif';g.fillText('$',13,35);
   g.font='bold 53px Georgia,serif';g.fillText('100',5,-72);
   g.font='bold 29px Georgia,serif';g.fillText('100',20,107);
   g.restore();
  }
  g.fillStyle='#e0e9c7';g.font='bold 28px Georgia,serif';
  g.fillText('COSMIC RAVE BANKNOTE',340,489);
 }else{
  g.fillStyle='#111827';g.fillRect(0,0,1024,512);
  g.lineWidth=13;g.strokeStyle='#dda85c';g.strokeRect(28,26,968,458);
  g.lineWidth=3;g.strokeRect(47,44,930,420);
  g.fillStyle='#f1d6a4';g.textAlign='center';
  g.font='bold 76px Georgia,serif';g.fillText('NEON RESERVE',512,195);
  g.font='bold 48px Georgia,serif';g.fillText('WHISKY',512,281);
  g.font='30px Georgia,serif';g.fillText('AFTER DARK · COSMIC EDITION',512,346);
 }
 const texture=new T.CanvasTexture(c);
 texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;
 return texture;
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
function bottle(labelTexture){
 const g=new T.Group();
 const glass=new T.MeshPhysicalMaterial({
  color:0x577a73,metalness:.18,roughness:.12,
  transparent:true,opacity:.68,depthWrite:false,side:T.DoubleSide
 });
 const whisky=new T.MeshStandardMaterial({
  color:0xc47a23,emissive:0x4b1904,emissiveIntensity:.35,
  metalness:.05,roughness:.25,transparent:true,opacity:.89
 });
 const gold=material(0xd8aa6b,.85,.22);
 const ink=material(0x11151b,.67,.3);
 // Turned lathe profile: broad shoulder, narrow neck and a sculpted base.
 const outline=[
  [0,0],[.42,0],[.50,.09],[.52,.20],[.53,1.28],
  [.49,1.53],[.35,1.72],[.23,1.85],[.23,2.23],[.23,2.42],[0,2.42]
 ].map(([r,y])=>new T.Vector2(r,y));
 part(g,new T.LatheGeometry(outline,32),glass);
 part(g,new T.CylinderGeometry(.425,.44,1.14,32),whisky,0,.68,0);
 part(g,new T.CylinderGeometry(.23,.23,.25,24),ink,0,2.45,0);
 part(g,new T.CylinderGeometry(.24,.24,.08,24),gold,0,2.59,0);
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  part(g,new T.BoxGeometry(.018,.21,.035),gold,
   Math.sin(a)*.241,2.44,Math.cos(a)*.241).rotation.y=a;
 }
 const label=new T.Mesh(new T.CylinderGeometry(.537,.537,.74,40,1,true),
  new T.MeshBasicMaterial({map:labelTexture||null,color:labelTexture?0xffffff:0x111822,side:T.DoubleSide}));
 label.position.y=1.03;g.add(label);
 const neckRing=part(g,new T.TorusGeometry(.235,.035,8,32),gold,0,2.24,0);
 neckRing.rotation.x=Math.PI/2;
 return g;
}
function dollarRoll(texture){
 const g=new T.Group();
 const green=material(0x255a38,.12,.73);
 const pale=new T.MeshBasicMaterial({color:0xb5f4b6});
 const print=new T.MeshStandardMaterial({map:texture||null,color:texture?0xffffff:0x75c68b,roughness:.55,side:T.DoubleSide});
 const rolled=part(g,new T.CylinderGeometry(.32,.32,1.57,40,1,true),print);
 const core=part(g,new T.CylinderGeometry(.15,.15,1.6,32),green);
 const dark=material(0x12291d,.05,.8);
 const hole=part(g,new T.CylinderGeometry(.105,.105,.03,24),dark,0,.804,0);
 part(g,new T.CylinderGeometry(.105,.105,.03,24),dark,0,-.804,0);
 for(const y of [-.75,.75]){
  const rim=part(g,new T.TorusGeometry(.32,.024,7,40),pale,0,y,0);
  rim.rotation.x=Math.PI/2;
 }
 const cuff=new T.Mesh(new T.CylinderGeometry(.334,.334,.14,40,1,true),pale);
 cuff.position.y=0;g.add(cuff);
 // Exposed corner: the bill must visually read as rolled green money, not a tube.
 const flap=part(g,new T.PlaneGeometry(.70,.74),print,.38,.36,.21);
 flap.rotation.y=-.5;flap.rotation.z=.22;
 g.rotation.z=.54;g.rotation.x=.22;
 g.position.y=1.03;
 return g;
}
function spotlightPod(kind,labels,dollar,seed=0){
 const g=pedestal(kind==='bottle'?0xffba67:0x6cff9c);
 const type=bottleTypeForEvent(seed);
 const model=kind==='bottle'?makePremiumBottle(type,labels[type]):makeRolledBanknote(dollar,seed);
 if(kind==='bottle'){model.scale.setScalar(1.13);model.position.y=.16;}
 else{model.scale.setScalar(1.20);model.position.y=.28;}
 g.add(model);
 const rim=part(g,new T.TorusGeometry(1.16,.035,5,32),
  new T.MeshBasicMaterial({color:kind==='bottle'?0xd19c55:0x37f4a9}),0,.12,0);
 rim.rotation.x=Math.PI/2;
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
  const base=part(group,new T.CylinderGeometry(.89,.96,.13,24),
   new T.MeshStandardMaterial({color:0x11192c,metalness:.75,roughness:.28}),0,.11,0);
  const aura=part(group,new T.TorusGeometry(.9,.052,7,28),
   new T.MeshBasicMaterial({color:highlight}),0,.2,0);
  aura.rotation.x=Math.PI/2;
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
   item.position.y=.24;
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
  const canvas=document.createElement('canvas');
  canvas.width=256;canvas.height=384;
  const c=canvas.getContext('2d');
  if(c){
   const grad=c.createLinearGradient(0,0,256,384);
   grad.addColorStop(0,'#ff67be');grad.addColorStop(1,'#722eff');
   c.fillStyle=grad;
   c.shadowColor='#f68dff';c.shadowBlur=28;
   c.beginPath();c.arc(128,53,27,0,Math.PI*2);c.fill();
   c.beginPath();
   c.moveTo(111,83);c.lineTo(145,83);c.lineTo(164,172);c.lineTo(151,227);
   c.lineTo(166,331);c.lineTo(145,355);c.lineTo(120,235);
   c.lineTo(105,355);c.lineTo(79,348);c.lineTo(104,216);c.lineTo(91,174);
   c.closePath();c.fill();
   c.lineWidth=18;c.lineCap='round';
   c.beginPath();c.moveTo(111,102);c.lineTo(60,153);c.lineTo(47,114);
   c.moveTo(146,105);c.lineTo(200,67);c.lineTo(216,115);c.stroke();
   c.shadowBlur=0;
   c.fillStyle='#32edff';c.fillRect(108,124,46,6);
  }
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  sprite.position.set(0,1.46,0);sprite.scale.set(1.63,2.48,1);
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
   const scale=2.23/height;
   person.scale.setScalar(scale);
   person.position.set(
    -(bbox.min.x+bbox.max.x)*.5*scale,
    .24-bbox.min.y*scale,
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
