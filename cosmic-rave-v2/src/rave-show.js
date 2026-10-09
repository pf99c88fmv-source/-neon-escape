import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {PROP_X,DANCER_X,PROP_SLOTS,DANCER_SLOTS,displayZ} from './premium-layout.js';

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
function spotlightPod(kind,label,dollar){
 const g=pedestal(kind==='bottle'?0xffba67:0x6cff9c);
 const model=kind==='bottle'?bottle(label):dollarRoll(dollar);
 if(kind==='bottle'){model.scale.setScalar(1.10);model.position.y=.08;}
 else{model.scale.setScalar(1.48);model.position.y=.55;}
 g.add(model);
 const glow=part(g,new T.TorusGeometry(1.16,.03,5,32),
  new T.MeshBasicMaterial({color:kind==='bottle'?0xd19c55:0x37f4a9}),0,.12,0);
 glow.rotation.x=Math.PI/2;
 g.userData.animated=model;
 return g;
}
export class RaveShow{
 constructor(scene){
  this.scene=scene;this.dancers=[];this.pods=[];this.ready=false;
  const whiskyLabel=canvasTexture('whisky');
  const banknote=canvasTexture('dollar');
  for(const spec of PROP_SLOTS){
   const group=spotlightPod(spec.kind,whiskyLabel,banknote);
   scene.add(group);this.pods.push({...spec,group});
  }
  // GLB is an optional independent decoration: network failure must never
  // prevent the main game from launching, playing music or controlling the hero.
  this.loadDancers();
 }
 async loadDancers(){
  try{
   const gltf=await new GLTFLoader().loadAsync(FESTIVAL_DANCER_URL);
   const clip=gltf.animations.find(c=>/samba|dance/i.test(c.name))||gltf.animations[0];
   if(!clip)throw Error('The sample has no dance animation');
   for(const spec of DANCER_SLOTS){
    const stage=pedestal(spec.side<0?0xff55c2:0x38f8f3);
    this.scene.add(stage);
    const person=cloneSkinned(gltf.scene);
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
  }catch(error){
   // A missing third-party character resource must not crash gameplay.
   this.failed=true;
   console.warn('Rave dancer GLB unavailable; continuing without optional NPCs:',error);
  }
 }
 update(beat,dt,travel){
  const pulse=Math.exp(-(beat%1)*9);
  for(const pod of this.pods){
   pod.group.position.set(pod.side*PROP_X,.14,displayZ(pod.slot,travel,6.0));
   pod.group.rotation.y=Math.sin(beat*.08+pod.slot)*.08;
   pod.group.userData.animated.rotation.y+=Math.min(dt,.05)*.30;
   pod.group.scale.setScalar(1+pulse*.012);
  }
  for(const d of this.dancers){
   d.stage.position.set(d.side*DANCER_X,.12,displayZ(d.slot,travel,5.2));
   d.mixer.update(Math.min(dt,.05));
   d.action.timeScale=1.0;
   d.stage.rotation.y=Math.sin(beat*.075+d.slot)*.07;
  }
 }
}
