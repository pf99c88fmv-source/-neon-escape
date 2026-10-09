import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SPB,zones} from './course.js?v=vitty-audio-2';
import {groovePose,selectRunAnimation} from './raver-motion.js';
import {styleRaverMaterial,findRigBone,attachClubHeadphones} from './raver-fashion.js';

export class Character{
 constructor(scene){
  this.root=new T.Group();scene.add(this.root);
  this.current='';this.actions={};this.until=0;
  this.lastX=0;this.previousGroove=[];this.grooveBones=[];
  this.restyledMeshes=0;
 }
 async load(){
  const gltf=await new GLTFLoader().loadAsync('./assets/models/raver.glb');
  this.model=gltf.scene;this.root.add(this.model);
  this.model.rotation.y=Math.PI;this.model.position.y=.06;
  this.model.scale.setScalar(1.42);
  const bones=[];
  this.model.traverse(o=>{
   if(o.isBone)bones.push(o);
   if(!o.isMesh)return;
   o.frustumCulled=false;
   o.castShadow=false;
   const restyle=m=>{
    if(m?.name==='MI_Superhero_Male'){
     this.restyledMeshes++;
     return styleRaverMaterial(m,T);
    }
    return m;
   };
   o.material=Array.isArray(o.material)?o.material.map(restyle):restyle(o.material);
  });
  this.mixer=new T.AnimationMixer(this.model);
  for(const clip of gltf.animations){
   const action=this.mixer.clipAction(clip);
   this.actions[clip.name]=action;
   if(/Hit|Death|Land/.test(clip.name)){
    action.setLoop(T.LoopOnce,1);
    action.clampWhenFinished=true;
   }
  }
  this.bones={
   head:findRigBone(bones,['head']),
   spine:findRigBone(bones,['spine2','spine1','upperchest','chest','spine']),
   leftShoulder:findRigBone(bones,['leftshoulder','shoulderl','lshoulder']),
   rightShoulder:findRigBone(bones,['rightshoulder','shoulderr','rshoulder']),
   leftArm:findRigBone(bones,['leftupperarm','leftarm','upperarml','lupperarm']),
   rightArm:findRigBone(bones,['rightupperarm','rightarm','upperarmr','rupperarm'])
  };
  this.grooveBones=Object.entries(this.bones).filter(([,bone])=>Boolean(bone));
  this.previousGroove=this.grooveBones.map(()=>new T.Quaternion());
  attachClubHeadphones(this.bones.head,T);
  this.play('Dance_Loop');
 }
 play(name){
  if(name===this.current||!this.actions[name])return;
  const next=this.actions[name];
  next.reset().setEffectiveWeight(1).play();
  if(this.current&&this.actions[this.current]){
   this.actions[this.current].crossFadeTo(next,.28,false);
  }
  this.current=name;
 }
 undoGroove(){
  // AnimationMixer doesn't necessarily animate every bone, so undo any prior
  // procedural offset before applying its next animation pose.
  for(let i=0;i<this.grooveBones.length;i++){
   const bone=this.grooveBones[i][1];
   bone.quaternion.multiply(this.previousGroove[i].clone().invert());
   this.previousGroove[i].identity();
  }
 }
 applyGroove(beat,active,combo,hit){
  const pose=groovePose(beat,active,combo,hit);
  const angles={
   head:[pose.headX,0,pose.headZ],
   spine:[pose.spineX,pose.spineY,pose.spineZ],
   leftShoulder:[pose.leftShoulderX,0,0],
   rightShoulder:[pose.rightShoulderX,0,0],
   leftArm:[0,0,pose.leftArmZ],
   rightArm:[0,0,pose.rightArmZ]
  };
  for(let i=0;i<this.grooveBones.length;i++){
   const [name,bone]=this.grooveBones[i];
   const [x,y,z]=angles[name];
   this.previousGroove[i].setFromEuler(new T.Euler(x,y,z));
   bone.quaternion.multiply(this.previousGroove[i]);
  }
  this.root.position.y=pose.bob;
  return pose;
 }
 update(dt,beat,x,active,hit=false,combo=0){
  if(!this.mixer)return;
  const safeDt=Math.max(0,Math.min(dt,.05));
  this.root.position.x=x;
  const velocity=safeDt>0?(x-this.lastX)/safeDt:0;
  this.lastX=x;
  if(hit)this.until=beat+1;
  const recovering=hit||beat<this.until;
  this.play(selectRunAnimation(beat,active,hit,this.until,this.result,zones[3].start));
  const action=this.actions[this.current];
  if(action)action.timeScale=active&&!recovering&&this.current!=='Death01'
   ?action.getClip().duration/(2*SPB):1;
  this.undoGroove();
  this.mixer.update(safeDt);
  const pose=this.applyGroove(beat,active,combo,recovering);
  const lean=T.MathUtils.clamp(-velocity*.012+pose.bodyLean,-.19,.19);
  this.root.rotation.z=T.MathUtils.damp(this.root.rotation.z,lean,8,safeDt);
  this.root.rotation.y=T.MathUtils.damp(this.root.rotation.y,pose.bodyYaw,7,safeDt);
 }
}
