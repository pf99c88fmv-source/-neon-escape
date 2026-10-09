import * as T from 'three';
import {wrap,FRAME_SPAN,NEAR_Z} from './tunnel-layout.js';

const COLORS=[0x4faafa,0xdc72e9,0x42e0c2,0xed82ba];
function makeGlowTexture(){
 const c=document.createElement('canvas');c.width=128;c.height=128;
 const g=c.getContext('2d');if(!g)return null;
 const grad=g.createRadialGradient(64,64,2,64,64,62);
 grad.addColorStop(0,'rgba(240,249,255,.6)');
 grad.addColorStop(.17,'rgba(150,215,255,.38)');
 grad.addColorStop(.44,'rgba(109,158,255,.15)');
 grad.addColorStop(.72,'rgba(60,100,225,.025)');
 grad.addColorStop(1,'rgba(45,85,195,0)');
 g.fillStyle=grad;g.fillRect(0,0,128,128);
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
export class TunnelAtmosphere{
 constructor(scene){
  this.colors=COLORS.map(c=>new T.Color(c));
  this.color=this.colors[0].clone();
  this.halos=[];this.mist=[];
  const texture=makeGlowTexture();
  for(let i=0;i<18;i++){
   const glow=new T.Sprite(new T.SpriteMaterial({
    map:texture,color:0x9dddff,transparent:true,opacity:.13,
    depthWrite:false,blending:T.AdditiveBlending
   }));
   const side=i%2===0?-1:1;
   glow.position.set(side*(6.6+i%3*1.5),3.2+i%4*1.2,-i*12);
   glow.scale.set(9+i%4*2.2,10+i%3*2.0,1);
   scene.add(glow);
   this.halos.push({glow,slot:i*12.75});
  }
  for(let i=0;i<5;i++){
   const mat=new T.MeshBasicMaterial({
    map:texture,color:0x648aba,transparent:true,opacity:.10,
    depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide
   });
   const cloud=new T.Mesh(new T.PlaneGeometry(12.5,21),mat);
   cloud.rotation.x=-Math.PI/2;cloud.position.y=-.055;
   scene.add(cloud);
   this.mist.push({cloud,slot:i*46});
  }
  const count=180;
  this.base=Array.from({length:count},(_,i)=>({
   x:((i*19.392)%1-.5)*24,y:.5+((i*7.144)%1)*11.5,
   z:(i*5.718)%FRAME_SPAN
  }));
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));
  this.points=new T.Points(geometry,new T.PointsMaterial({
   color:0xa9e0ff,size:.12,transparent:true,opacity:.44,
   depthWrite:false,sizeAttenuation:true
  }));
  this.points.frustumCulled=false;scene.add(this.points);
  this.update(0,.016,0,0);
 }
 setQuality(preset){
  const enabled=preset!=='low';
  for(const {glow} of this.halos)glow.visible=enabled;
  for(const {cloud} of this.mist)cloud.visible=enabled;
  this.points.visible=enabled;
 }
 update(beat,dt,travel,zone=0){
  this.color.lerp(this.colors[Math.max(0,Math.min(3,zone))],Math.min(1,Math.max(0,dt)*1.4));
  const pulse=Math.exp(-(beat%1)*8);
  const wave=.5+.5*Math.sin(beat*Math.PI*.5);
  for(let i=0;i<this.halos.length;i++){
   const h=this.halos[i];
   h.glow.position.z=NEAR_Z-wrap(h.slot-travel,FRAME_SPAN);
   h.glow.material.color.copy(this.color);
   h.glow.material.opacity=.095+.045*wave+.045*pulse;
  }
  for(const m of this.mist){
   m.cloud.position.z=NEAR_Z-wrap(m.slot-travel,FRAME_SPAN)-14;
   m.cloud.material.color.copy(this.color);
   m.cloud.material.opacity=.072+.022*wave;
  }
  const position=this.points.geometry.attributes.position;
  for(let i=0;i<this.base.length;i++){
   const b=this.base[i];
   position.setXYZ(i,b.x+Math.sin(beat*.06+i)*.11,b.y,
    NEAR_Z-wrap(b.z-travel,FRAME_SPAN));
  }
  position.needsUpdate=true;
 }
}
