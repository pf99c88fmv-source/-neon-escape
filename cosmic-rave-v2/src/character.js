import {SPB} from './course.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export class Character{
 constructor(scene){this.root=new T.Group();scene.add(this.root);this.current='';this.actions={};this.until=0;}
 async load(){const gltf=await new GLTFLoader().loadAsync('./assets/models/raver.glb');this.model=gltf.scene;this.root.add(this.model);this.model.rotation.y=Math.PI;this.model.position.y=.06;this.model.scale.setScalar(1.42);
 this.model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=true;const m=o.material;m.roughness=.65;if(m.name==='MI_Superhero_Male'){m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 costumePosition;').replace('#include <begin_vertex>','#include <begin_vertex>\ncostumePosition=position;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 costumePosition;').replace('#include <map_fragment>',`#include <map_fragment>
float y=costumePosition.y;float x=abs(costumePosition.x);
float outfit=step(.09,y)*step(y,1.46)*(1.-step(.67,x));
vec3 suit=mix(vec3(.012,.02,.052),vec3(.06,.10,.19),smoothstep(.9,1.3,y));
float stripe=step(.018,abs(y-1.27))*step(abs(y-1.27),.032)+step(x,.23)*step(.215,x)*step(y,1.36)*step(.94,y);
vec3 jacket=mix(suit,vec3(.02,.7,.85),clamp(stripe,0.,1.));
diffuseColor.rgb=mix(diffuseColor.rgb,jacket,outfit);
`);};}}});
 this.mixer=new T.AnimationMixer(this.model);for(const clip of gltf.animations){this.actions[clip.name]=this.mixer.clipAction(clip);if(/Hit|Death|Land/.test(clip.name)){this.actions[clip.name].setLoop(T.LoopOnce,1);this.actions[clip.name].clampWhenFinished=true;}}
 this.head=this.model.getObjectByName('Head');this.play('Dance_Loop');
 }
 play(name){if(name===this.current||!this.actions[name])return;const next=this.actions[name];next.reset().setEffectiveWeight(1).play();if(this.current)this.actions[this.current].crossFadeTo(next,.22,false);this.current=name;}
 update(dt,beat,x,active,hit=false){if(!this.mixer)return;this.root.position.x=x;this.root.rotation.z=T.MathUtils.damp(this.root.rotation.z,-(x-(this.lastX??x))*.25,10,dt);this.lastX=x;
 if(hit)this.until=beat+1;
 this.play(this.result||(hit||beat<this.until?'Hit_Chest':active?(beat>=144?'Sprint_Loop':'Jog_Fwd_Loop'):'Dance_Loop'));
 const action=this.actions[this.current];if(active&&!/Hit/.test(this.current))action.timeScale=action.getClip().duration/(2*SPB);else action.timeScale=1;
 this.mixer.update(dt);if(active&&this.head)this.head.rotation.x+=Math.sin(beat*Math.PI*2)*.035;
 }
}
