import * as T from 'three';

// Readable arcade silhouettes, with no real-world brand/trademarked labels.
export const BOTTLE_TYPES=Object.freeze(['whisky','vodka','champagne','cognac']);
export function bottleTypeForEvent(id=0){return BOTTLE_TYPES[Math.abs(Math.floor(id))%BOTTLE_TYPES.length];}
const COLORS={
 whisky:{glass:0xa17b4b,liquid:0xb56f20,neck:0xb98742,label:'NIGHT RESERVE',sub:'WHISKY',metal:0xe3bc83},
 vodka:{glass:0xb5edff,liquid:0xb6e8f1,neck:0xa8dafa,label:'POLAR NOVA',sub:'VODKA',metal:0xd3ebfb},
 champagne:{glass:0x1d7556,liquid:0xd2b66a,neck:0xe5ce89,label:'STELLAR BRUT',sub:'CHAMPAGNE',metal:0xf7db98},
 cognac:{glass:0x915b39,liquid:0xb76a28,neck:0xe1ad64,label:'SOLAR VINTAGE',sub:'COGNAC',metal:0xfbd49b}
};
function add(group,geometry,material,x=0,y=0,z=0){
 const m=new T.Mesh(geometry,material);m.position.set(x,y,z);group.add(m);return m;
}
function basic(color){return new T.MeshBasicMaterial({color});}
function metal(color){return new T.MeshStandardMaterial({color,metalness:.78,roughness:.24});}
export function makeBottleLabelTexture(type='whisky'){
 const spec=COLORS[type]||COLORS.whisky;
 const c=document.createElement('canvas');c.width=512;c.height=360;
 const g=c.getContext('2d');if(!g)return null;
 const gradient=g.createLinearGradient(0,0,512,360);
 gradient.addColorStop(0,'#0c1827');gradient.addColorStop(.48,'#233344');
 gradient.addColorStop(1,'#0c1420');
 g.fillStyle=gradient;g.fillRect(0,0,512,360);
 g.strokeStyle=type==='vodka'?'#bafaff':'#f0c77f';g.lineWidth=11;
 g.strokeRect(16,16,480,328);g.lineWidth=3;g.strokeRect(29,29,454,302);
 g.textAlign='center';g.fillStyle='#eff1e3';
 g.font='bold 30px Georgia,serif';g.fillText(spec.label,256,100);
 g.fillStyle=type==='vodka'?'#96e9f3':'#ffd595';
 g.font='bold 64px Georgia,serif';g.fillText(spec.sub,256,188);
 g.fillStyle='#bccbcb';g.font='bold 18px sans-serif';
 g.fillText('COSMIC RAVE COLLECTION',256,258);
 g.font='16px sans-serif';g.fillText('EST. 2026  •  STAGE EDITION',256,297);
 const tex=new T.CanvasTexture(c);
 tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=2;
 return tex;
}
export function makePremiumBottle(type='whisky',texture=null){
 const spec=COLORS[type]||COLORS.whisky;
 const g=new T.Group();
 const glass=new T.MeshPhysicalMaterial({
  color:spec.glass,metalness:.06,roughness:type==='vodka'?.18:.13,
  transmission:0,transparent:true,opacity:type==='champagne'?.88:.68,
  depthWrite:false,side:T.DoubleSide
 });
 const drink=new T.MeshStandardMaterial({
  color:spec.liquid,emissive:spec.liquid,emissiveIntensity:.12,
  metalness:.02,roughness:.28,transparent:true,opacity:.81
 });
 const collar=metal(spec.metal);
 const dark=metal(0x161b25);
 let labelY=1.02,labelWidth=.72,labelHeight=.75,labelZ=.47,neckY=2.42;
 if(type==='whisky'){
  // Square club whisky flask with wide shoulders.
  add(g,new T.BoxGeometry(.99,1.43,.72),glass,0,.93,0);
  add(g,new T.BoxGeometry(.79,1.12,.56),drink,0,.80,0);
  add(g,new T.CylinderGeometry(.22,.39,.40,24),glass,0,1.84,0);
  add(g,new T.CylinderGeometry(.205,.205,.47,24),glass,0,2.22,0);
  labelZ=.376;labelWidth=.77;labelHeight=.82;labelY=1.07;neckY=2.43;
 }else if(type==='vodka'){
  // Tall cylindrical frost-glass bottle with visibly thin neck.
  const profile=[[0,0],[.30,0],[.37,.12],[.39,.18],[.39,1.75],
   [.34,1.91],[.18,2.09],[.18,2.50],[0,2.50]];
  add(g,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),32),glass);
  add(g,new T.CylinderGeometry(.32,.32,1.41,32),drink,0,.87,0);
  labelZ=.415;labelWidth=.62;labelHeight=.9;labelY=1.20;neckY=2.53;
 }else if(type==='champagne'){
  // Long green champagne silhouette with foiled neck and cork.
  const profile=[[0,0],[.32,0],[.41,.16],[.42,.32],[.42,1.20],
   [.40,1.42],[.31,1.65],[.17,1.94],[.16,2.41],[0,2.41]];
  add(g,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),36),glass);
  add(g,new T.CylinderGeometry(.33,.34,1.15,32),drink,0,.81,0);
  add(g,new T.CylinderGeometry(.178,.178,.64,24),collar,0,2.26,0);
  labelZ=.43;labelWidth=.66;labelHeight=.71;labelY=1.10;neckY=2.61;
 }else{
  // Squat broad-shouldered amber cognac decanter.
  const profile=[[0,0],[.42,0],[.57,.14],[.61,.3],[.61,1.32],
   [.50,1.56],[.25,1.73],[.23,2.08],[0,2.08]];
  add(g,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),36),glass);
  add(g,new T.CylinderGeometry(.50,.51,1.20,32),drink,0,.77,0);
  labelZ=.635;labelWidth=.88;labelHeight=.72;labelY=1.02;neckY=2.13;
 }
 add(g,new T.CylinderGeometry(.23,.23,.15,28),dark,0,neckY,0);
 add(g,new T.CylinderGeometry(type==='champagne'?.25:.245,.24,.085,28),collar,0,neckY+.12,0);
 for(const y of [neckY-.17,neckY+.13]){
  const edge=add(g,new T.TorusGeometry(.238,.024,8,28),collar,0,y,0);
  edge.rotation.x=Math.PI/2;
 }
 const label=add(g,new T.PlaneGeometry(labelWidth,labelHeight),
  new T.MeshStandardMaterial({
   map:texture||null,color:texture?0xffffff:0x162636,
   roughness:.65,metalness:.1,transparent:false,side:T.DoubleSide
  }),0,labelY,labelZ);
 // Label stands out against the silhouette when viewed from the runner camera.
 label.renderOrder=2;
 const medallion=add(g,new T.TorusGeometry(labelWidth*.28,.014,5,28),collar,
  0,labelY+labelHeight*.05,labelZ+.012);
 medallion.scale.y=1.3;
 return g;
}
export function makeBanknoteTexture(){
 const c=document.createElement('canvas');c.width=1024;c.height=512;
 const g=c.getContext('2d');if(!g)return null;
 const pale=g.createLinearGradient(0,0,0,512);
 pale.addColorStop(0,'#b2d5a5');pale.addColorStop(.5,'#8bb981');
 pale.addColorStop(1,'#d6e6bb');
 g.fillStyle=pale;g.fillRect(0,0,1024,512);
 g.fillStyle='#245d3b';
 for(let i=0;i<100;i++){
  g.globalAlpha=i%2?.06:.1;
  const x=(i*97.13)%1024,y=(i*53.71)%512;
  g.fillRect(x,y,34+(i%6)*12,1.5);
 }
 g.globalAlpha=1;
 g.strokeStyle='#326849';g.lineWidth=10;g.strokeRect(12,12,1000,488);
 g.lineWidth=3;g.strokeRect(30,27,964,456);
 const ornamental=(x,y,r)=>{
  for(let j=0;j<12;j++){
   g.beginPath();g.ellipse(x,y,r*(.65+j*.032),r*(.50+j*.038),j*Math.PI/12,0,Math.PI*2);
   g.strokeStyle=j%3?'rgba(33,95,54,.3)':'#38784b';
   g.lineWidth=1;g.stroke();
  }
 };
 ornamental(514,254,162);
 for(const side of [75,890]){
  g.fillStyle='#1f5636';g.font='bold 100px Georgia,serif';
  g.fillText('100',side,118);
  g.font='bold 88px Georgia,serif';g.fillText('$',side+25,380);
 }
 g.fillStyle='#18492e';g.textAlign='center';
 g.font='bold 146px Georgia,serif';g.fillText('100',510,298);
 g.font='bold 35px Georgia,serif';g.fillText('UNITED STATES',510,83);
 g.font='bold 29px Georgia,serif';g.fillText('ONE HUNDRED DOLLARS',510,438);
 g.font='bold 23px monospace';
 g.textAlign='left';g.fillText('CR-2026  0100100',132,481);
 const tex=new T.CanvasTexture(c);
 tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=2;
 return tex;
}
export function makeRolledBanknote(texture,variant=0){
 const g=new T.Group(),tight=(variant%2===0);
 const radius=tight?.28:.37,len=tight?1.64:1.76;
 const paper=new T.MeshStandardMaterial({
  color:0xffffff,map:texture||null,roughness:.82,metalness:0,
  side:T.DoubleSide
 });
 const edge=basic(0xe8f6d5),core=basic(0x244b33);
 // The roll is hollow: separate outer paper and visible inner coils.
 add(g,new T.CylinderGeometry(radius,radius,len,40,1,true),paper);
 add(g,new T.CylinderGeometry(radius*.55,radius*.55,len+.005,32,1,true),core);
 for(const end of [-1,1]){
  const y=end*(len*.5+.006);
  for(const r of [radius*.55,radius*.72,radius*.90]){
   const ring=add(g,new T.TorusGeometry(r,.010,5,42),edge,0,y,0);
   ring.rotation.x=Math.PI/2;
  }
 }
 // A recognisable unrolled paper tail carries the $100 print.
 const ribbon=new T.PlaneGeometry(tight?.84:1.12,.72,14,6);
 const xyz=ribbon.attributes.position;
 for(let i=0;i<xyz.count;i++){
  const x=xyz.getX(i),y=xyz.getY(i);
  xyz.setZ(i,.10*Math.sin(x*3.6)+.18*x*x+.03*Math.sin(y*8));
 }
 ribbon.computeVertexNormals();
 const tail=add(g,ribbon,paper,radius+.33,.27,radius*.72);
 tail.rotation.y=-.33;tail.rotation.z=tight?.16:.24;
 const iridescent=add(g,new T.CylinderGeometry(radius+.013,radius+.013,.068,40,1,true),
  basic(0x91dfaa),0,0,0);
 g.rotation.set(1.00,.30,.50);
 const root=new T.Group();root.add(g);root.position.y=1.46;
 root.scale.setScalar(tight?1.16:1.1);
 return root;
}
// A skinned female GLB keeps its actual skeleton. Re-shade the body to
// a stage-performer aesthetic, not a new primitive mannequin.
export function styleNightclubDancer(person){
 person.traverse(o=>{
  if(!o.isMesh)return;
  o.frustumCulled=false;
  const apply=base=>{
   if(!base?.isMeshStandardMaterial)return base;
   const m=base.clone();
   m.roughness=.63;m.metalness=.07;m.userData={...m.userData,stageOwned:true};
   const prior=m.onBeforeCompile;
   m.onBeforeCompile=shader=>{
    prior?.(shader);
    shader.vertexShader=shader.vertexShader
     .replace('#include <common>','#include <common>\nvarying vec3 vStagePosition;')
     .replace('#include <begin_vertex>','#include <begin_vertex>\nvStagePosition=position;');
    shader.fragmentShader=shader.fragmentShader
     .replace('#include <common>','#include <common>\nvarying vec3 vStagePosition;')
     .replace('#include <map_fragment>',`#include <map_fragment>
      // Light-toned skin for the fictional adult stage character.
      float y=vStagePosition.y, x=abs(vStagePosition.x);
      float warm=smoothstep(.005,.095,diffuseColor.r-diffuseColor.b)
       *smoothstep(.055,.24,diffuseColor.r);
      float face=smoothstep(1.44,1.56,y)*(1.-smoothstep(1.88,2.02,y));
      float exposed=(1.-smoothstep(.25,.44,x))*(1.-smoothstep(.73,.94,y));
      float skinMask=max(warm*.85,warm*face*.92);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.70,.60),skinMask*.82);
      // Magenta metallic nightclub bodysuit with cyan waistband; limbs
      // remain driven by the original rig and SambaDance animation.
      float bodice=smoothstep(.77,.92,y)*(1.-smoothstep(1.30,1.44,y))
       *(1.-smoothstep(.34,.53,x));
      float hotpants=smoothstep(.55,.64,y)*(1.-smoothstep(.85,.94,y))
       *(1.-smoothstep(.45,.56,x));
      float dress=clamp(bodice+hotpants,0.,1.);
      vec3 magenta=vec3(.64,.032,.35);
      diffuseColor.rgb=mix(diffuseColor.rgb,magenta,dress*.96);
      float waist=(1.-smoothstep(.016,.047,abs(y-.85)))*(1.-smoothstep(.44,.55,x));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.05,.88,.95),waist*.70);
      totalEmissiveRadiance+=vec3(.12,.025,.17)*dress*.25
       +vec3(.015,.22,.23)*waist*.22;
      // A visible thigh-high boot is clubwear, not bare legs.
      float boots=(1.-smoothstep(.32,.42,y))*(1.-smoothstep(.50,.63,x));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.055,.028,.083),boots*.91);
    `);
   };
   m.customProgramCacheKey=()=> 'stage-dancer-light-skin-bodysuit-v2';
   m.needsUpdate=true;
   return m;
  };
  o.material=Array.isArray(o.material)?o.material.map(apply):apply(o.material);
 });
 return person;
}
