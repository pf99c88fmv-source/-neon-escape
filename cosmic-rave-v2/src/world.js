import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SPB,SPEED,depth,zones,zoneAt,isPickup} from './course.js?v=arcade-finish-2';
import {TunnelArchitecture} from './tunnel.js?v=cathedral-1';
import {RaveShow} from './rave-show.js?v=cash-hover-1';
import {TunnelAtmosphere} from './tunnel-atmosphere.js';
import {createCosmicBackdrop} from './cosmic-sky.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
const box=new T.BoxGeometry(1,1,1),sparkGeometry=new T.TetrahedronGeometry(.16,0);
const hazardPillar=new T.CylinderGeometry(.10,.10,1,10);
const hazardScreen=new T.PlaneGeometry(1,1);
const hazardMembrane=new T.MeshBasicMaterial({
 color:0xa41e64,side:T.DoubleSide,transparent:true,opacity:.19,depthWrite:false
});
const hazardMetal=new T.MeshStandardMaterial({
 color:0x37142a,metalness:.69,roughness:.25,
 emissive:0x3a1024,emissiveIntensity:.30
});
const hazardSignal=new T.MeshBasicMaterial({color:0xff609b});
const hazardWarn=new T.MeshBasicMaterial({color:0xffbd6a});
function mesh(g,m,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
function makeHazard(kind){
 const g=new T.Group();
 const height=kind==='laser'?2.28:kind==='wall'?1.85:1.7;
 // Raised metal energy frame with rounded glowing light-pipes, not a flat
 // rectangular pink placeholder. The collider remains in course.js.
 for(const side of [-1,1]){
  g.add(mesh(box,hazardMetal,side*.85,height*.52,0,.25,height+.11,.46));
  const bar=mesh(hazardPillar,hazardSignal,side*.85,height*.52,.27,.56,height-.15,.56);
  g.add(bar);
  g.add(mesh(box,hazardWarn,side*.87,.12,.35,.19,.12,.22));
 }
 g.add(mesh(box,hazardMetal,0,height+.035,-.03,1.96,.29,.52));
 g.add(mesh(box,hazardSignal,0,height+.13,.25,1.8,.09,.13));
 const field=mesh(hazardScreen,hazardMembrane,0,height*.52,.13,1.62,height-.10,1);
 g.add(field);
 if(kind==='laser'){
  for(const side of [-1,1]){
   const slash=mesh(box,hazardWarn,side*.45,height*.51,.26,.055,height*.67,.10);
   slash.rotation.z=side*.32;
   g.add(slash);
  }
 }else if(kind==='shard'){
  const icon=mesh(new T.OctahedronGeometry(.28,0),hazardWarn,0,height-.27,.41);
  icon.rotation.z=Math.PI/4;
  g.add(icon);
 }else{
  for(const x of [-.47,0,.47]){
   const stripe=mesh(box,hazardWarn,x,.41,.30,.12,.33,.055);
   stripe.rotation.z=.18;
   g.add(stripe);
  }
 }
 return g;
}
export class World{
 constructor(canvas){this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.91;
 this.scene=new T.Scene();this.scene.fog=new T.FogExp2(0x080e20,.0067);this.camera=new T.PerspectiveCamera(62,innerWidth/innerHeight,.1,450);this.distance=8.3;this.reduced=true;this.scene.add(new T.HemisphereLight(0xb9d6ff,0x171c36,1.85));const key=new T.DirectionalLight(0xf1e6ff,2.6);key.position.set(-3,7,4);this.scene.add(key);this.rim=new T.PointLight(0x12ddff,36,23);this.rim.position.set(0,4,3);this.scene.add(this.rim);
 this.metal=new T.MeshStandardMaterial({color:0x32445d,metalness:.86,roughness:.26});this.dark=new T.MeshStandardMaterial({color:0x091327,metalness:.68,roughness:.4});this.neon=new T.MeshStandardMaterial({color:0x32d9ff,emissive:0x00bfff,emissiveIntensity:2,metalness:.3,roughness:.3});this.accent=new T.MeshStandardMaterial({color:0x884fff,emissive:0x7933ff,emissiveIntensity:1.6});this.red=new T.MeshStandardMaterial({color:0xff3979,emissive:0xb90832,emissiveIntensity:1.5,metalness:.35,roughness:.3});this.gold=new T.MeshStandardMaterial({color:0xffd475,emissive:0xffa629,emissiveIntensity:.75,metalness:.6,roughness:.3});
 this.pickupMint=new T.MeshBasicMaterial({color:0x59ffb6});
 this.pickupPink=new T.MeshBasicMaterial({color:0xff66ca});
 this.tunnel=new TunnelArchitecture(this.scene,{metal:this.metal,dark:this.dark,neon:this.neon,accent:this.accent});
 this.show=new RaveShow(this.scene);this.atmosphere=new TunnelAtmosphere(this.scene);
 // Volumetric-looking nebula, layered starfield and detailed planets.
 this.backdrop=createCosmicBackdrop(this.scene);this.sky=this.backdrop.sky;
 // The old four neon torus rings and swinging low-poly cones were the
 // most conspicuous cheap-looking elements. Replace them with a subtle
 // distant spatial glow at the vanishing point; no torus geometry.
 this.portal=new T.Group();
 this.portal.position.set(0,3.10,-168);
 const horizon=new T.Mesh(new T.PlaneGeometry(38,25),new T.ShaderMaterial({
  transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
  uniforms:{uBeat:{value:0}},
  vertexShader:`varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision mediump float;varying vec2 vUv;uniform float uBeat;
    void main(){
     vec2 v=(vUv-.5)*2.;
     float haze=exp(-dot(v*vec2(2.4,3.2),v*vec2(2.4,3.2))*1.6);
     float horizon=exp(-abs(v.y)*26.)*exp(-abs(v.x)*2.5);
     float glow=exp(-dot(v*vec2(5.0,5.0),v*vec2(5.0,5.0))*2.1);
     float breath=.82+.18*sin(uBeat*.20);
     vec3 teal=vec3(.10,.38,.52),lilac=vec3(.24,.17,.39);
     vec3 color=mix(teal,lilac,smoothstep(.18,.85,abs(v.x)));
     gl_FragColor=vec4(color*(.35+horizon*.46+glow*.22),
      (haze*.18+horizon*.16+glow*.17)*breath);
    }`
 }));
 this.portal.add(horizon);
 this.scene.add(this.portal);
 this.lasers=[];
 this.objects=new Map();this.particles=[];this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(innerWidth/2,innerHeight/2),.33,.58,1.08);this.composer.addPass(this.bloom);
 this.fxaa=new ShaderPass(FXAAShader);
 this.composer.addPass(this.fxaa);
 this.composer.addPass(new OutputPass());this.quality('auto');this.resize();addEventListener('resize',()=>this.resize());
 }
 quality(q){this.preset=q;this.dpr=q==='low'?1:q==='ultra'?Math.min(devicePixelRatio,2):q==='balanced'?Math.min(devicePixelRatio,1.45):Math.min(devicePixelRatio,1.65);this.bloom.enabled=q!=='low';this.fxaa.enabled=q!=='low';this.show.setQuality(q);this.atmosphere.setQuality(q);this.renderer.setPixelRatio(this.dpr);this.composer.setPixelRatio(this.dpr);this.resize();}
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.composer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();
 if(this.fxaa)this.fxaa.material.uniforms.resolution.value.set(
  1/(Math.max(1,innerWidth)*this.dpr),1/(Math.max(1,innerHeight)*this.dpr)
 );
}
 reset(){for(const o of this.objects.values()){this.show.releasePickup(o);this.scene.remove(o);}this.objects.clear();for(const p of this.particles)this.scene.remove(p);this.particles=[];}
 burst(x,hit=false,kind='orb'){const sparkle=hit?this.red:kind==='dancer'?this.pickupPink:kind==='cash'?this.pickupMint:this.gold;for(let i=0;i<16;i++){const p=mesh(sparkGeometry,sparkle,x,1.3,0,.65,.65,.65);p.userData={life:1,v:new T.Vector3(Math.sin(i*2.4)*3,1+Math.cos(i)*2,Math.cos(i*2.4)*3)};this.scene.add(p);this.particles.push(p);}}
 update(beat,dt,run,active){const z=zoneAt(beat),zone=zones[z];this.neon.color.lerp(new T.Color(zone.color),dt);this.neon.emissive.lerp(new T.Color(zone.color),dt);this.accent.emissive.lerp(new T.Color(zone.accent),dt);const pulse=Math.exp(-(beat%1)*8);this.neon.emissiveIntensity=1.15+pulse*(this.reduced?.15:.5);this.rim.intensity=30+pulse*5;this.backdrop.update(beat,dt);this.portal.children[0].material.uniforms.uBeat.value=beat;
 const travel=beat*SPB*SPEED;this.tunnel.update(travel,beat,this.reduced);this.show.update(beat,dt,travel);this.atmosphere.update(beat,dt,travel,z);
 this.lasers.forEach((g,i)=>{g.rotation.z=Math.sin(beat*.22+i)*.55;g.rotation.x=Math.cos(beat*.14+i)*.2;});
 for(const e of run?.events||[]){const zz=depth(e.beat,beat);if(zz>8||e.passed){const o=this.objects.get(e.id);if(o){this.show.releasePickup(o);this.scene.remove(o);this.objects.delete(e.id);}continue;}if(zz<-100)continue;let o=this.objects.get(e.id);if(!o){o=new T.Group();const pickup=isPickup(e.kind);
 if(e.kind==='dancer'||e.kind==='bottle'||e.kind==='cash'){
  const special=this.show.makePickup(e.kind,e.id);
  o.userData.specialModel=special;
  o.add(special);
 }else if(pickup){
  // Reserved for future non-spherical rewards: three premium kinds only.
  console.warn('Unimplemented pickup kind',e.kind);
 }else{o.add(makeHazard(e.kind));}this.scene.add(o);this.objects.set(e.id,o);}o.position.set(e.x,0,zz);if(isPickup(e.kind)){
  if(e.kind==='dancer'){
   o.rotation.y=Math.sin(beat*.19+e.id)*.30;
   o.position.y=Math.sin(beat*Math.PI*2)*.045;
  }else if(e.kind==='cash'){
   // The actual banknote mesh lives at y=2.20 in its pickup group.
   // Float the entire item gently, never back down into the track.
   o.rotation.y=Math.sin(beat*.27+e.id)*.30;
   o.position.y=Math.sin(beat*2*Math.PI+e.id)*.12;
  }else{
   o.rotation.y=Math.sin(beat*.27+e.id)*.25;
   o.position.y=Math.sin(beat*2*Math.PI+e.id)*.038;
  }
 }
 }
 for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.v,dt);p.scale.setScalar(Math.max(0,p.userData.life)*.2);if(p.userData.life<=0){this.scene.remove(p);this.particles.splice(i,1);}}
 const x=run?.x||0;this.camera.position.set(x*.22,3.8,this.distance);this.camera.lookAt(x*.08,2,-15);this.camera.fov=T.MathUtils.damp(this.camera.fov,active&&z===3?67:62,2,dt);this.camera.updateProjectionMatrix();
 }
 render(){this.composer.render();}
}
