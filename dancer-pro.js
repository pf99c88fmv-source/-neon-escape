import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x06091b);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);camera.position.set(0,1.7,5.8);camera.lookAt(0,1.2,0);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xddeaff,0x322046,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,6,5);scene.add(light);
const stage=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.8,.2,48),new THREE.MeshStandardMaterial({color:0x101d38,metalness:.7,roughness:.3}));stage.position.y=-.1;scene.add(stage);
const ring=new THREE.Mesh(new THREE.TorusGeometry(1.7,.045,8,48),new THREE.MeshBasicMaterial({color:0x16eeff}));ring.rotation.x=Math.PI/2;scene.add(ring);
let dancer,mixer,action,rotating=true;const clock=new THREE.Clock(),status=document.querySelector('#status');
document.querySelector('#turn').onclick=()=>{rotating=!rotating;};
document.querySelector('#restart').onclick=()=>{if(action){action.reset();action.play();}};
new GLTFLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Michelle.glb',gltf=>{
dancer=gltf.scene;const box=new THREE.Box3().setFromObject(dancer),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=2.8/Math.max(size.y,.001);
dancer.scale.setScalar(scale);dancer.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);scene.add(dancer);
if(gltf.animations.length){mixer=new THREE.AnimationMixer(dancer);action=mixer.clipAction(gltf.animations.find(x=>/dance|samba/i.test(x.name))||gltf.animations[0]);action.play();}
status.textContent='Готовая GLB-модель · '+gltf.animations.length+' анимаций';
},undefined,err=>{console.error(err);status.textContent='Ошибка загрузки GLB — проверь соединение';});
function frame(){requestAnimationFrame(frame);const dt=Math.min(.05,clock.getDelta());if(mixer)mixer.update(dt);if(dancer&&rotating)dancer.rotation.y+=dt*.25;renderer.render(scene,camera);}frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});