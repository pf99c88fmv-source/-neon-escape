import * as T from 'three';
import {ARCH_PROFILE,FRAME_COUNT,FRAME_STEP,frameZ} from './tunnel-layout.js';
// Instanced 3D architecture: one uniform transport clock and no collision geometry.
const up=new T.Vector3(0,1,0);
const vec=(x,y,z)=>new T.Vector3(x,y,z);
// An elliptic continuous arch (rather than repeated angular girders).
const archPoints=Array.from({length:27},(_,i)=>{
 const a=Math.PI-i*Math.PI/26;
 return new T.Vector3(Math.cos(a)*6.12,.40+Math.sin(a)*8.16,0);
});
const smoothVault=new T.TubeGeometry(new T.CatmullRomCurve3(archPoints),90,.19,10,false);
const innerVault=new T.TubeGeometry(new T.CatmullRomCurve3(archPoints.map(p=>new T.Vector3(p.x*.962,p.y*.970,0))),90,.042,8,false);
export class TunnelArchitecture{
 constructor(scene,m){
  this.materials={
   shell:m.metal,recess:m.dark,cyan:m.neon,ultraviolet:m.accent,
   brushed:new T.MeshStandardMaterial({color:0x35445e,metalness:.83,roughness:.28}),
   deep:new T.MeshStandardMaterial({color:0x07152b,metalness:.68,roughness:.36}),
   amber:new T.MeshStandardMaterial({color:0xffc17a,emissive:0xe56b28,emissiveIntensity:1.2,metalness:.5,roughness:.22}),
   glass:new T.MeshBasicMaterial({color:0x2389b9,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}),
   lane:new T.MeshBasicMaterial({color:0x2f9ec3,transparent:true,opacity:.54,depthWrite:false}),
   platinum:new T.MeshStandardMaterial({color:0x65778b,metalness:.73,roughness:.34}),
   graphite:new T.MeshStandardMaterial({color:0x151e30,metalness:.62,roughness:.40}),
   satin:new T.MeshStandardMaterial({color:0x37465b,metalness:.75,roughness:.28}),
   warm:new T.MeshBasicMaterial({color:0xffc69e,transparent:true,opacity:.48,depthWrite:false}),
   ice:new T.MeshBasicMaterial({color:0xa2e3f5,transparent:true,opacity:.43,depthWrite:false}),
   halo:new T.MeshBasicMaterial({
    color:0x52d8ff,transparent:true,opacity:.105,
    depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide
   }),
   magentaHalo:new T.MeshBasicMaterial({
    color:0xea7bfa,transparent:true,opacity:.094,
    depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide
   }),
   floor:new T.ShaderMaterial({
    uniforms:{uTime:{value:0},uPulse:{value:0},uTint:{value:new T.Color(0x218dba)}},
    transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
    vertexShader:`varying vec2 vUv;void main(){
     vUv=uv;vec4 p=vec4(position,1.);
     #ifdef USE_INSTANCING
     p=instanceMatrix*p;
     #endif
     gl_Position=projectionMatrix*modelViewMatrix*p;
    }`,
    fragmentShader:`precision mediump float;
     varying vec2 vUv;uniform float uTime,uPulse;uniform vec3 uTint;
     void main(){
      float x=vUv.x-.5, y=vUv.y;
      float pulse=min(1.,uPulse);
      // Fine runway guidance, like light embedded under smoked glass.
      float lane=(1.-smoothstep(.003,.016,abs(x-.25)))+
                 (1.-smoothstep(.003,.016,abs(x+.25)));
      float edge=smoothstep(.35,.50,abs(x));
      float brushed=.5+.5*sin(x*95.+sin(y*17.)*.4);
      float motion=pow(.5+.5*sin(y*22.-uTime*2.4),15.);
      float skyline=exp(-abs(x)*2.6)*(.035+.12*motion);
      float reflection=.028*brushed+.085*motion*(.4+edge);
      float alpha=clamp(.030+lane*.12+skyline+reflection,0.,.21);
      vec3 color=uTint*(.17+.37*lane+.17*pulse+.20*motion);
      color+=vec3(.025,.035,.07)*(1.-edge)*(.3+.7*brushed);
      gl_FragColor=vec4(color,alpha);
     }`
   }),
   holo:new T.ShaderMaterial({
    uniforms:{uTime:{value:0},uPulse:{value:0},uTint:{value:new T.Color(0x31b8f2)}},
    transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;vec4 p=vec4(position,1.);\n#ifdef USE_INSTANCING\np=instanceMatrix*p;\n#endif\ngl_Position=projectionMatrix*modelViewMatrix*p;}`,
    fragmentShader:`precision mediump float;varying vec2 vUv;uniform float uTime,uPulse;uniform vec3 uTint;
     void main(){
      float feather=smoothstep(.02,.14,vUv.x)*(1.-smoothstep(.86,.98,vUv.x));
      float edge=smoothstep(.01,.05,vUv.y)*(1.-smoothstep(.95,.99,vUv.y));
      float lines=.08+.19*pow(.5+.5*sin(vUv.y*35.-uTime*.85),12.);
      float shimmer=.5+.5*sin(vUv.x*9.+vUv.y*6.-uTime*.7);
      float alpha=feather*edge*(.10+lines*.19+shimmer*.03+uPulse*.045);
      gl_FragColor=vec4(uTint*(.55+shimmer*.3),alpha);
     }`
   })
  };
  this.geometry={
   block:new T.BoxGeometry(1,1,1),
   pane:new T.PlaneGeometry(1,1),
   vault:smoothVault,
   inVault:innerVault
  };
  this.zoneColors=[0x247ca8,0x6c47a9,0x249c9a,0x9e4f90].map(c=>new T.Color(c));
  this.parts=[];
  this.frames=Array.from({length:FRAME_COUNT},()=>new T.Matrix4());
  this.work=new T.Matrix4();this.spin=new T.Matrix4();
  for(let i=0;i<FRAME_COUNT;i++)this.bay(i);
  const buckets=new Map();
  for(const p of this.parts){
   const key=p.shape+'|'+p.material;
   if(!buckets.has(key))buckets.set(key,[]);
   buckets.get(key).push(p);
  }
  this.batches=[];
  for(const [key,items] of buckets){
   const [shape,material]=key.split('|');
   const instanced=new T.InstancedMesh(this.geometry[shape],this.materials[material],items.length);
   instanced.frustumCulled=false;
   instanced.instanceMatrix.setUsage(T.DynamicDrawUsage);
   scene.add(instanced);
   this.batches.push({instanced,items});
  }
  this.stats={frames:FRAME_COUNT,instances:this.parts.length,drawCalls:this.batches.length};
  this.update(0,0,true);
 }
 add(slot,shape,material,[x,y,z],[sx,sy,sz],rotation=[0,0,0],spin=0){
  const q=new T.Quaternion().setFromEuler(new T.Euler(...rotation));
  const matrix=new T.Matrix4().compose(vec(x,y,z),q,vec(sx,sy,sz));
  this.parts.push({slot,shape,material,matrix,spin});
 }
 beam(slot,material,start,end,width=.15,thickness=.22){
  const a=vec(...start),b=vec(...end),axis=b.clone().sub(a);
  const q=new T.Quaternion().setFromUnitVectors(up,axis.clone().normalize());
  const matrix=new T.Matrix4().compose(a.add(b).multiplyScalar(.5),q,vec(width,axis.length(),thickness));
  this.parts.push({slot,shape:'block',material,matrix,spin:0});
 }
 bay(i){
  // Each bay is a coherent piece of architecture, not a stack of glowing
  // rings. A six-bay cycle offers a hero portal, quiet facade, suspension
  // deck, open view, stage balcony and a dark recovery beat.
  const mode=i%6;
  const hero=mode===0;
  const bridge=mode===2;
  const soft=mode===4;
  const primary=hero||bridge||soft;
  const zMid=-FRAME_STEP*.5;
  const edgeGlow=hero?'cyan':bridge?'ice':'ultraviolet';

  // Continuous black-titanium road, satin edging and deliberate lane markings.
  this.add(i,'block','deep',[0,-.28,zMid],[10.45,.35,FRAME_STEP+.08]);
  this.add(i,'block','graphite',[0,-.092,zMid],[9.7,.025,FRAME_STEP]);
  this.add(i,'pane','floor',[0,-.072,zMid],[9.50,FRAME_STEP,1],[-Math.PI/2,0,0]);
  for(const side of [-1,1]){
   this.add(i,'block','platinum',[side*4.93,-.19,zMid],[.19,.28,FRAME_STEP-.05]);
   this.add(i,'block','ice',[side*4.79,-.026,zMid],[.038,.022,FRAME_STEP-.18]);
   this.add(i,'block','satin',[side*5.14,-.30,zMid],[.31,.20,FRAME_STEP-.05]);
  }
  for(const x of [-2.42,0,2.42])
   this.add(i,'block','lane',[x,-.054,zMid],[.018,.010,FRAME_STEP-.30]);

  // Structural spine: the true half-elliptic arch is dark titanium on most
  // frames, with a restrained inset light only at major architectural beats.
  if(primary){
   this.add(i,'vault',hero?'satin':'graphite',[0,0,-.48],[1,1,1]);
   this.add(i,'vault','graphite',[0,0,-.63],[1.10,1.075,.96]);
   if(hero||soft){
    this.add(i,'inVault',edgeGlow,[0,.025,-.23],[1,1,1]);
    this.add(i,'vault',hero?'halo':'magentaHalo',[0,.02,-.55],[1.06,1.06,1.0]);
   }
  }else if(mode===1||mode===5){
   // Open bays give real contrast, keeping the stars and planets visible.
   for(const side of [-1,1])
    this.beam(i,'satin',[side*6.15,.42,-.15],[side*6.60,5.35,-1.0],.25,.48);
  }

  // Lower architectural walls are continuous but layered with regular dark
  // shadow gaps, so light and space read as solid materials, not wireframes.
  for(const side of [-1,1]){
   this.add(i,'block','graphite',[side*7.70,2.4,zMid],[.34,4.55,FRAME_STEP-.22]);
   this.add(i,'block','deep',[side*7.48,2.28,zMid],[.16,2.10,FRAME_STEP-.45]);
   this.add(i,'block','satin',[side*5.74,3.88,zMid],[.21,.23,FRAME_STEP-.80]);
   this.add(i,'block','graphite',[side*7.05,.10,zMid],[2.05,.40,FRAME_STEP-.18]);
   this.add(i,'block','platinum',[side*5.80,.22,zMid],[.16,.20,FRAME_STEP-.25]);

   // A few panoramic cyan panels, not a bright screen on every wall.
   if(hero||mode===3){
    this.add(i,'pane','holo',[side*5.66,2.38,zMid],[FRAME_STEP-1.4,2.16,1],[0,side*Math.PI/2,0]);
    this.add(i,'block',edgeGlow,[side*5.60,3.67,zMid],[.035,.035,FRAME_STEP-2.2]);
   }else{
    this.add(i,'block','satin',[side*5.63,4.10,zMid],[.08,.13,FRAME_STEP-1.25]);
   }
   // Double-height vertical facade fins feel like a designed techno venue.
   for(const localZ of [-FRAME_STEP*.39,FRAME_STEP*.39]){
    this.add(i,'block','platinum',[side*5.83,2.57,zMid+localZ],[.20,4.54,.30]);
    if(hero)this.add(i,'block','ice',[side*5.69,2.61,zMid+localZ],[.033,3.05,.08]);
   }
  }

  // Ceiling light is inset into the building, safely above gameplay.
  if(hero){
   this.add(i,'block','graphite',[0,8.52,-2.8],[5.8,.34,2.8]);
   for(const x of [-1.90,0,1.90]){
    this.add(i,'block','platinum',[x,8.31,-2.8],[.67,.095,2.36]);
    this.add(i,'block','ice',[x,8.22,-2.8],[.42,.032,1.70]);
   }
   for(const side of [-1,1]){
    this.beam(i,'warm',[side*7.38,4.08,-1.15],[side*7.82,5.72,-3.9],.065,.10);
   }
  }else if(bridge){
   this.add(i,'block','satin',[0,8.32,-2.8],[4.8,.25,2.1]);
   this.add(i,'block','ice',[0,8.15,-2.8],[2.75,.032,.12]);
  }else if(mode===3){
   this.add(i,'block','graphite',[0,8.49,-2.2],[5.5,.20,1.0]);
   this.add(i,'block','warm',[0,8.34,-2.2],[2.7,.026,.065]);
  }
 }
 update(travel,beat,reduced=true){
  for(let i=0;i<FRAME_COUNT;i++)this.frames[i].makeTranslation(0,0,frameZ(i,travel));
  for(const batch of this.batches){
   batch.items.forEach((p,j)=>{
    this.work.multiplyMatrices(this.frames[p.slot],p.matrix);
    if(p.spin){this.spin.makeRotationZ(beat*p.spin);this.work.multiply(this.spin);}
    batch.instanced.setMatrixAt(j,this.work);
   });
   batch.instanced.instanceMatrix.needsUpdate=true;
  }
  const pulse=Math.exp(-(beat%1)*8);
  // Smoothly blend reflective-floor and panoramic-panel colors by music
  // section, independently from the UI and gameplay objects.
  const idx=beat<181?0:beat<362?1:beat<543?2:3;
  this.materials.floor.uniforms.uTint.value.lerp(this.zoneColors[idx],.025);
  this.materials.holo.uniforms.uTint.value.lerp(this.zoneColors[idx],.018);
  this.materials.floor.uniforms.uTime.value=beat;
  this.materials.floor.uniforms.uPulse.value=reduced?pulse*.45:pulse;
  this.materials.holo.uniforms.uTime.value=beat*.45;
  this.materials.holo.uniforms.uPulse.value=reduced?pulse*.4:pulse;
  this.materials.glass.opacity=(reduced?.17:.22)+pulse*(reduced?.035:.1);
  this.materials.halo.opacity=.050+pulse*(reduced?.006:.014);
  this.materials.magentaHalo.opacity=.043+pulse*(reduced?.006:.012);
  this.materials.lane.opacity=.25+pulse*(reduced?.04:.07);
  this.materials.amber.emissiveIntensity=1.2+pulse*(reduced?.15:.4);
 }
}
