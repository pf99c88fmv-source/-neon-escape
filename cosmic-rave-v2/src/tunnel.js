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
const smoothVault=new T.TubeGeometry(new T.CatmullRomCurve3(archPoints),52,.12,6,false);
const innerVault=new T.TubeGeometry(new T.CatmullRomCurve3(archPoints.map(p=>new T.Vector3(p.x*.955,p.y*.955,0))),52,.048,6,false);
export class TunnelArchitecture{
 constructor(scene,m){
  this.materials={
   shell:m.metal,recess:m.dark,cyan:m.neon,ultraviolet:m.accent,
   brushed:new T.MeshStandardMaterial({color:0x35445e,metalness:.83,roughness:.28}),
   deep:new T.MeshStandardMaterial({color:0x07152b,metalness:.68,roughness:.36}),
   amber:new T.MeshStandardMaterial({color:0xffc17a,emissive:0xe56b28,emissiveIntensity:1.2,metalness:.5,roughness:.22}),
   glass:new T.MeshBasicMaterial({color:0x2389b9,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}),
   lane:new T.MeshBasicMaterial({color:0x2f9ec3,transparent:true,opacity:.54,depthWrite:false}),
   platinum:new T.MeshStandardMaterial({color:0x657b91,metalness:.9,roughness:.2}),
   ice:new T.MeshBasicMaterial({color:0x8de9ff,transparent:true,opacity:.63,depthWrite:false}),
   holo:new T.ShaderMaterial({
    uniforms:{uTime:{value:0},uPulse:{value:0},uTint:{value:new T.Color(0x31b8f2)}},
    transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision mediump float;varying vec2 vUv;uniform float uTime,uPulse;uniform vec3 uTint;
     void main(){
      float feather=smoothstep(.02,.14,vUv.x)*(1.-smoothstep(.86,.98,vUv.x));
      float edge=smoothstep(.01,.05,vUv.y)*(1.-smoothstep(.95,.99,vUv.y));
      float lines=.22+.24*pow(.5+.5*sin(vUv.y*64.-uTime*4.),7.);
      float shimmer=.5+.5*sin(vUv.x*9.+vUv.y*6.-uTime*.7);
      float alpha=feather*edge*(.16+lines*.35+shimmer*.07+uPulse*.11);
      gl_FragColor=vec4(uTint*(.55+shimmer*.3),alpha);
     }`
   })
  };
  this.geometry={
   block:new T.BoxGeometry(1,1,1),
   torus:new T.TorusGeometry(1.65,.075,6,32),
   pane:new T.PlaneGeometry(1,1),
   vault:smoothVault,
   inVault:innerVault
  };
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
  const type=i%4;
  // Broad silver roof curves and inlaid luminous arcs soften the previously
  // boxy corridor. Low-radius tubes stay overhead and outside the safe lanes.
  this.add(i,'vault','platinum',[0,0,-.46],[1,1,1]);
  this.add(i,'inVault',type===0?'ultraviolet':'ice',[0,.06,.28],[1,1,1]);
  if(type===0)this.add(i,'vault','cyan',[0,0,-3.2],[.988,.99,1]);
  // Faceted secondary supports remain to provide structural depth.
  // Faceted roof: structural ribs, inset dark backing and emissive filaments.
  for(let k=0;k<ARCH_PROFILE.length-1;k++){
   const [x,y]=ARCH_PROFILE[k],[xx,yy]=ARCH_PROFILE[k+1];
   this.beam(i,'shell',[x,y,.1],[xx,yy,.1],type===0?.42:.35,.66);
   this.beam(i,'recess',[x*.982,y-.08,.71],[xx*.982,yy-.08,.71],.18,.07);
   this.beam(i,(k%4===0&&type===0)?'amber':type===2?'ultraviolet':'cyan',
     [x*.97,y-.14,.79],[xx*.97,yy-.14,.79],type===0?.075:.055,.09);
  }
  for(const side of [-1,1]){
   this.beam(i,'brushed',[side*6.25,.45,-.65],[side*7.25,4.2,-2.3],.28,.55);
   this.beam(i,'shell',[side*7.25,4.2,-2.3],[side*5.28,6.15,-3.2],.25,.48);
   this.beam(i,'recess',[side*6.1,.45,-2.75],[side*6.1,5.65,-2.75],.95,.48);
   this.beam(i,'cyan',[side*5.56,.75,-2.45],[side*5.56,5.2,-2.45],.055,.085);
   this.add(i,'block','deep',[side*6.85,2.3,-5.5],[1.38,4.5,9.9]);
   this.add(i,'block','brushed',[side*6.05,2.3,-5.5],[.13,4.3,9.8]);
   // Two oriented side panes; their silhouettes are outside the playable width.
   this.add(i,'pane','holo',[side*5.96,2.65,-5.6],[7.8,3.5,1],[0,side*Math.PI/2,0]);
   this.add(i,'block',type===1?'ultraviolet':'cyan',[side*5.93,4.35,-5.6],[.065,.1,8.6]);
   this.add(i,'block','shell',[side*7.1,-.12,-5.3],[2.5,.33,10.8]);
   this.add(i,'block','deep',[side*7.55,1.1,-5.4],[.65,2.1,7.2]);
   for(let t=0;t<3;t++){
    this.add(i,'block',t===1?'cyan':'brushed',
      [side*7.12,.65+t*1.02,-5.45],[.22,.12,5.75-t*.72]);
   }
  }
  // The playable corridor is 9.6 world units wide. Side structures never enter it.
  this.add(i,'block','deep',[0,-.28,-5.55],[10.4,.34,11.37]);
  // Brushed silver runway rails add material depth without extra light beams.
  for(const side of [-1,1]){
   this.add(i,'block','platinum',[side*4.92,-.26,-5.55],[.14,.12,10.7]);
   this.add(i,'block','ice',[side*4.82,-.13,-5.55],[.045,.02,10.7]);
  }
  for(const x of [-3.64,-1.22,1.22,3.64])
   this.add(i,'block','lane',[x,-.095,-5.55],[.032,.016,10.7]);
  for(const side of [-1,1]){
   this.add(i,'block',i%3===0?'ultraviolet':'cyan',[side*4.72,-.03,-5.55],[.075,.075,10.65]);
   this.add(i,'block','brushed',[side*4.84,-.22,-5.55],[.32,.4,10.65]);
  }
  // Deep hanging canopy is above the central field of play.
  for(const x of [-2.9,0,2.9]){
   this.add(i,'block','recess',[x,8.63,-5.7],[1.18,.11,4.45]);
   this.add(i,'block',i%3===0?'amber':'ice',[x,8.52,-5.7],[.58,.038,2.5]);
  }
  // Distinct alternating shapes prevent the repeated corridor look.
  if(type===0){
   this.add(i,'torus','ultraviolet',[0,8.22,-3.8],[1.16,1.16,1],[.24,0,0],.12);
   this.add(i,'torus','cyan',[0,8.23,-3.76],[.65,.65,1],[0,.23,0],-.19);
   for(const side of [-1,1])
    this.beam(i,'amber',[side*7.1,4.25,-2],[side*8.3,6.2,-3.1],.12,.2);
  }else if(type===1){
   for(const side of [-1,1]){
    this.beam(i,'ultraviolet',[side*6.02,1.1,-.7],[side*8.45,6.65,-7.6],.085,.15);
    this.beam(i,'shell',[side*8.3,6.6,-7.6],[side*5.3,8.35,-9],.33,.48);
   }
  }else if(type===2){
   for(const side of [-1,1])
    for(let k=0;k<4;k++)
     this.add(i,'block','ultraviolet',[side*6.02,1.35+k*.78,-3.6-k*.5],[.055,.055,1.55]);
   this.add(i,'block','brushed',[0,8.55,-2.9],[4.5,.28,2]);
  }else{
   for(const side of [-1,1]){
    this.add(i,'block','shell',[side*7.85,3.8,-3.1],[1.2,3.3,1.2]);
    this.add(i,'torus','cyan',[side*7.85,4.5,-2.48],[.45,.45,.75]);
    this.add(i,'torus','ultraviolet',[side*7.85,3.15,-2.48],[.3,.3,.7]);
   }
   this.beam(i,'amber',[-3.8,7.65,-.5],[3.8,7.65,-.5],.09,.14);
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
  this.materials.holo.uniforms.uTime.value=beat*.45;
  this.materials.holo.uniforms.uPulse.value=reduced?pulse*.4:pulse;
  this.materials.glass.opacity=(reduced?.17:.22)+pulse*(reduced?.035:.1);
  this.materials.lane.opacity=.53+pulse*(reduced?.1:.23);
  this.materials.amber.emissiveIntensity=1.2+pulse*(reduced?.15:.4);
 }
}
