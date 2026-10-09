import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x06091b);scene.fog=new THREE.Fog(0x06091b,13,35);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,70);camera.position.set(0,2.15,8.5);camera.lookAt(0,1.15,0);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=false;document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x9feaff,0x241236,2.3));const key=new THREE.DirectionalLight(0xffffff,2.7);key.position.set(3,7,5);scene.add(key);
const rim=new THREE.PointLight(0xff39c5,38,13);rim.position.set(-3,3,-2);scene.add(rim);
const mat=(c,metal=.12)=>new THREE.MeshStandardMaterial({color:c,metalness:metal,roughness:.45});
const skin=mat(0xe6a68c),hair=mat(0x1e1027),cloth=mat(0x182642,.6),neon=new THREE.MeshStandardMaterial({color:0x14dbf5,emissive:0x00a9ff,emissiveIntensity:1.6,metalness:.4,roughness:.28}),pink=new THREE.MeshStandardMaterial({color:0xff46ad,emissive:0x7d0a52,emissiveIntensity:.6,metalness:.45,roughness:.25});
const floor=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.8,.14,48),mat(0x11172f,.65));floor.position.y=-.15;scene.add(floor);
const stage=new THREE.Mesh(new THREE.TorusGeometry(2.55,.045,8,64),neon);stage.rotation.x=Math.PI/2;stage.position.y=-.055;scene.add(stage);
const person=new THREE.Group();scene.add(person);
function part(parent,geo,material,x,y,z){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;}
const sphere=(p,m,x,y,z,a,b,c)=>{const o=part(p,new THREE.SphereGeometry(1,16,12),m,x,y,z);o.scale.set(a,b,c);return o;};
const torso=new THREE.Group();torso.position.y=1.78;person.add(torso);
sphere(torso,cloth,0,.02,0,.36,.55,.23);sphere(torso,skin,0,.55,0,.16,.17,.15);
const waist=sphere(person,cloth,0,1.27,0,.37,.23,.25);
const chestStripe=part(torso,new THREE.BoxGeometry(.53,.07,.07),neon,0,.15,-.235);
const neck=part(torso,new THREE.CylinderGeometry(.12,.14,.21,12),skin,0,.59,0);
const head=new THREE.Group();head.position.y=.83;torso.add(head);
sphere(head,skin,0,0,0,.245,.32,.22);
sphere(head,hair,0,.25,.055,.26,.18,.24);
for(const side of [-1,1]){sphere(head,hair,side*.23,.03,.13,.09,.29,.12);sphere(head,mat(0x251c27),side*.105,.035,-.203,.046,.032,.013);sphere(head,mat(0xffffff),side*.103,.035,-.219,.029,.024,.013);sphere(head,mat(0x2e8eac),side*.103,.035,-.235,.012,.014,.007);}
sphere(head,skin,0,-.07,-.225,.055,.08,.08);
const mouth=part(head,new THREE.BoxGeometry(.085,.018,.012),pink,0,-.19,-.205);
const arms=[],forearms=[],legs=[],shins=[];
for(const side of [-1,1]){
 const arm=new THREE.Group();arm.position.set(side*.39,.4,0);torso.add(arm);arms.push(arm);
 sphere(arm,skin,side*.07,-.28,0,.125,.34,.12);
 sphere(arm,pink,side*.03,-.03,0,.17,.11,.17);
 const fore=new THREE.Group();fore.position.set(side*.1,-.55,0);arm.add(fore);forearms.push(fore);
 sphere(fore,skin,0,-.22,0,.105,.28,.11);sphere(fore,neon,0,-.44,0,.125,.065,.125);
 const leg=new THREE.Group();leg.position.set(side*.19,1.19,0);person.add(leg);legs.push(leg);
 sphere(leg,skin,0,-.37,0,.17,.44,.17);
 const shin=new THREE.Group();shin.position.y=-.76;leg.add(shin);shins.push(shin);
 sphere(shin,skin,0,-.34,0,.14,.39,.15);sphere(shin,cloth,0,-.59,-.035,.17,.32,.19);
 part(shin,new THREE.BoxGeometry(.31,.065,.38),neon,0,-.87,-.09);
}
const hairLocks=[];
for(let i=0;i<7;i++){const g=new THREE.Group();g.position.set((i-3)*.068,.15,.19);head.add(g);sphere(g,hair,0,-.29,0,.063,.36,.065);hairLocks.push(g);}
let style=0,dance=0,rotating=true;const palettes=[[0x17243c,0x14dbf5],[0x501e50,0xff42bd],[0x242936,0xffcb52],[0x1c4b48,0x54ffb8]];
document.querySelector('#style').onclick=()=>{style=(style+1)%4;cloth.color.setHex(palettes[style][0]);neon.color.setHex(palettes[style][1]);};
document.querySelector('#dance').onclick=()=>{dance=(dance+1)%4;document.querySelector('#status').textContent='Танец '+(dance+1)+'/4 · экспериментальная модель';};
document.querySelector('#turn').onclick=()=>{rotating=!rotating;};
let t=0,prev=performance.now();
function frame(now){const dt=Math.min(.04,(now-prev)/1000);prev=now;t+=dt;const beat=t*Math.PI*2*2.2;person.position.y=.07+Math.abs(Math.sin(beat*.5))*.1;
if(rotating)person.rotation.y+=dt*.35;
torso.rotation.z=Math.sin(beat*.5)*(.12+dance*.025);head.rotation.z=-torso.rotation.z*.7;
arms[0].rotation.z=-.35-Math.sin(beat+(dance%2)*1.3)*(.4+dance*.14);
arms[1].rotation.z=.35+Math.cos(beat+(dance%2)*1.3)*(.4+dance*.14);
forearms[0].rotation.z=-.2-Math.sin(beat*.5)*.55;forearms[1].rotation.z=.2+Math.cos(beat*.5)*.55;
legs[0].rotation.x=Math.sin(beat)*(.18+dance*.09);legs[1].rotation.x=-Math.sin(beat)*(.18+dance*.09);
for(let i=0;i<hairLocks.length;i++)hairLocks[i].rotation.z=Math.sin(beat*.5+i*.5)*.08;
renderer.render(scene,camera);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});