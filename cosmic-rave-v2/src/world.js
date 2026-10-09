import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SPB,SPEED,depth,zones,zoneAt} from './course.js';
import {TunnelArchitecture} from './tunnel.js?v=premium-show-1';
import {RaveShow} from './rave-show.js';
import {createCosmicBackdrop} from './cosmic-sky.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
const box=new T.BoxGeometry(1,1,1),orb=new T.IcosahedronGeometry(.38,1),pickupRing=new T.TorusGeometry(.58,.045,6,24);
function mesh(g,m,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
export class World{
 constructor(canvas){this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
 this.scene=new T.Scene();this.scene.fog=new T.FogExp2(0x070c20,.0058);this.camera=new T.PerspectiveCamera(62,innerWidth/innerHeight,.1,450);this.distance=8.3;this.reduced=true;this.scene.add(new T.HemisphereLight(0xc6e9ff,0x352149,2.5));const key=new T.DirectionalLight(0xf1e6ff,3.5);key.position.set(-3,7,4);this.scene.add(key);this.rim=new T.PointLight(0x12ddff,70,22);this.rim.position.set(0,4,3);this.scene.add(this.rim);
 this.metal=new T.MeshStandardMaterial({color:0x32445d,metalness:.86,roughness:.26});this.dark=new T.MeshStandardMaterial({color:0x091327,metalness:.68,roughness:.4});this.neon=new T.MeshStandardMaterial({color:0x32d9ff,emissive:0x00bfff,emissiveIntensity:2,metalness:.3,roughness:.3});this.accent=new T.MeshStandardMaterial({color:0x884fff,emissive:0x7933ff,emissiveIntensity:1.6});this.red=new T.MeshStandardMaterial({color:0xff3979,emissive:0xb90832,emissiveIntensity:1.5,metalness:.35,roughness:.3});this.gold=new T.MeshStandardMaterial({color:0xffd475,emissive:0xffa629,emissiveIntensity:1.3,metalness:.6,roughness:.2});
 this.tunnel=new TunnelArchitecture(this.scene,{metal:this.metal,dark:this.dark,neon:this.neon,accent:this.accent});
 this.show=new RaveShow(this.scene);
 // Volumetric-looking nebula, layered starfield and detailed planets.
 this.backdrop=createCosmicBackdrop(this.scene);this.sky=this.backdrop.sky;
 this.portal=new T.Group();this.portal.position.set(0,3.2,-155);for(let i=0;i<4;i++){const r=mesh(new T.TorusGeometry(6+i*1.5,.2,8,64),i%2?this.neon:this.accent,0,0,-i*2);this.portal.add(r);}this.scene.add(this.portal);
 this.lasers=[];for(let i=0;i<8;i++){const g=new T.Group();g.position.set(i%2?5:-5,5,-i*18);const light=mesh(new T.ConeGeometry(.65,16,8,1,true),new T.MeshBasicMaterial({color:i%2?0x962fff:0x13dfff,transparent:true,opacity:.09,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),0,-8,0);g.add(light);this.scene.add(g);this.lasers.push(g);}
 this.objects=new Map();this.particles=[];this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new T.Vector2(innerWidth/2,innerHeight/2),.45,.45,1.05);this.composer.addPass(this.bloom);
 this.fxaa=new ShaderPass(FXAAShader);
 this.composer.addPass(this.fxaa);
 this.composer.addPass(new OutputPass());this.quality('auto');this.resize();addEventListener('resize',()=>this.resize());
 }
 quality(q){this.preset=q;this.dpr=q==='low'?1:q==='ultra'?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.4);this.bloom.enabled=q!=='low';this.fxaa.enabled=q!=='low';this.renderer.setPixelRatio(this.dpr);this.composer.setPixelRatio(this.dpr);this.resize();}
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.composer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();
 if(this.fxaa)this.fxaa.material.uniforms.resolution.value.set(
  1/(Math.max(1,innerWidth)*this.dpr),1/(Math.max(1,innerHeight)*this.dpr)
 );
}
 reset(){for(const o of this.objects.values())this.scene.remove(o);this.objects.clear();for(const p of this.particles)this.scene.remove(p);this.particles=[];}
 burst(x,hit=false){for(let i=0;i<16;i++){const p=mesh(orb,hit?this.red:this.gold,x,1.3,0,.15,.15,.15);p.userData={life:1,v:new T.Vector3(Math.sin(i*2.4)*3,1+Math.cos(i)*2,Math.cos(i*2.4)*3)};this.scene.add(p);this.particles.push(p);}}
 update(beat,dt,run,active){const z=zoneAt(beat),zone=zones[z];this.neon.color.lerp(new T.Color(zone.color),dt);this.neon.emissive.lerp(new T.Color(zone.color),dt);this.accent.emissive.lerp(new T.Color(zone.accent),dt);const pulse=Math.exp(-(beat%1)*8);this.neon.emissiveIntensity=1.4+pulse*(this.reduced?.2:.7);this.rim.intensity=55+pulse*15;this.backdrop.update(beat,dt);this.portal.rotation.z=Math.sin(beat*.04)*.18;
 const travel=beat*SPB*SPEED;this.tunnel.update(travel,beat,this.reduced);this.show.update(beat,dt,travel);
 this.lasers.forEach((g,i)=>{g.rotation.z=Math.sin(beat*.22+i)*.55;g.rotation.x=Math.cos(beat*.14+i)*.2;});
 for(const e of run?.events||[]){const zz=depth(e.beat,beat);if(zz>8||e.passed){const o=this.objects.get(e.id);if(o){this.scene.remove(o);this.objects.delete(e.id);}continue;}if(zz<-100)continue;let o=this.objects.get(e.id);if(!o){o=new T.Group();const pickup=e.kind==='orb'||e.kind==='shield';if(pickup){o.add(mesh(orb,e.kind==='shield'?this.neon:this.gold,0,1.25,0));o.add(mesh(pickupRing,e.kind==='shield'?this.neon:this.gold,0,1.25,0));}else{const h=e.kind==='laser'?2.2:1.7;o.add(mesh(box,this.dark,0,h/2,0,1.75,h,.6));o.add(mesh(box,this.red,0,h,0,1.85,.12,.7));for(const s of [-1,1])o.add(mesh(box,this.red,s*.86,h/2,0,.1,h,.7));if(e.kind==='shard')o.rotation.z=.12;}this.scene.add(o);this.objects.set(e.id,o);}o.position.set(e.x,0,zz);if(e.kind==='orb'||e.kind==='shield')o.rotation.y=beat*1.8;
 }
 for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.v,dt);p.scale.setScalar(Math.max(0,p.userData.life)*.2);if(p.userData.life<=0){this.scene.remove(p);this.particles.splice(i,1);}}
 const x=run?.x||0;this.camera.position.set(x*.22,3.8,this.distance);this.camera.lookAt(x*.08,2,-15);this.camera.fov=T.MathUtils.damp(this.camera.fov,active&&z===3?67:62,2,dt);this.camera.updateProjectionMatrix();
 }
 render(){this.composer.render();}
}
