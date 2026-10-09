import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const tg=window.Telegram?.WebApp;try{tg?.ready();tg?.expand();}catch{}
const root=document.querySelector('#viewport'),scoreEl=document.querySelector('#score'),comboEl=document.querySelector('#combo'),healthEl=document.querySelector('#health'),screen=document.querySelector('#screen'),message=document.querySelector('#message'),play=document.querySelector('#play'),mute=document.querySelector('#mute');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x030513);scene.fog=new THREE.FogExp2(0x030513,.013);
const camera=new THREE.PerspectiveCamera(69,innerWidth/innerHeight,.1,220);camera.position.set(0,1.9,11);camera.lookAt(0,0,-24);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});let renderScale=Math.min(devicePixelRatio,1.7);let contextLost=false;renderer.setPixelRatio(renderScale);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;root.appendChild(renderer.domElement);renderer.domElement.style.touchAction='none';renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;paused=true;last=0;audio?.suspend();message.textContent='Графический контекст потерян. Перезагрузи страницу для продолжения.';play.textContent='ПЕРЕЗАГРУЗИТЬ ↻';screen.style.display='flex';});
scene.add(new THREE.HemisphereLight(0x7bbaff,0x08041c,2.1));const light=new THREE.PointLight(0x00dfff,45,30);light.position.set(0,3,5);scene.add(light);
const mat=(color,emissive=color,intensity=.65)=>new THREE.MeshStandardMaterial({color,metalness:.65,roughness:.26,emissive,emissiveIntensity:intensity,side:THREE.DoubleSide});
const cyan=mat(0x20dbff),pink=mat(0xff287e),violet=mat(0x7840ff),dark=mat(0x101d39,0x061123,.18),gold=mat(0xffcf5a);
const tunnel=new THREE.Group();scene.add(tunnel);const rings=[];for(let i=0;i<28;i++){const g=new THREE.Group();const z=8-i*7;g.position.z=z;const radius=9;for(let k=0;k<8;k++){const a=k*Math.PI/4,b=(k+1)*Math.PI/4;const pts=[new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,0),new THREE.Vector3(Math.cos(b)*radius,Math.sin(b)*radius,0)];const geo=new THREE.BufferGeometry().setFromPoints(pts);g.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:i%4===0?0xff288c:0x14a3ff,transparent:true,opacity:.92})));}tunnel.add(g);rings.push(g);}
for(let k=0;k<8;k++){const a=k*Math.PI/4;const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a)*9,Math.sin(a)*9,10),new THREE.Vector3(Math.cos(a)*9,Math.sin(a)*9,-190)]);tunnel.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:k%2?0x172b73:0x12496d,transparent:true,opacity:.65})));}
// Rave-club tunnel architecture: glowing ribs, wall panels and luminous runway.
const clubRibs=[];
const ribCyan=new THREE.MeshBasicMaterial({color:0x08cfff,transparent:true,opacity:.72});
const ribPink=new THREE.MeshBasicMaterial({color:0xff2cb4,transparent:true,opacity:.72});
const wallDark=new THREE.MeshBasicMaterial({color:0x120b31,side:THREE.DoubleSide,transparent:true,opacity:.48,depthWrite:false});
for(let i=0;i<14;i++){
 const g=new THREE.Group();g.position.z=-i*14;
 for(const side of [-1,1]){
  g.add(mesh(new THREE.BoxGeometry(.16,10,.24),i%3===0?ribPink:ribCyan,side*8,-.2,0,0,0,side*.23));
  g.add(mesh(new THREE.BoxGeometry(2.4,.17,.32),i%2?ribPink:ribCyan,side*5.9,5.8,0,0,0,side*.3));
  g.add(mesh(new THREE.BoxGeometry(2.4,.15,.32),ribCyan,side*4.3,-3.5,0));
  g.add(mesh(new THREE.PlaneGeometry(4.2,3.5),wallDark,side*8,1.6,-.15,0,side*Math.PI/2));
 }
 g.add(mesh(new THREE.BoxGeometry(8.5,.13,.32),i%4===0?ribPink:ribCyan,0,6.2,0));
 tunnel.add(g);clubRibs.push(g);
}
const runway=new THREE.Group();scene.add(runway);
const floorMat=new THREE.MeshBasicMaterial({color:0x0b1033,transparent:true,opacity:.52,side:THREE.DoubleSide,depthWrite:false});
runway.add(mesh(new THREE.PlaneGeometry(13,195),floorMat,0,-3.72,-86,-Math.PI/2));
for(const x of [-5.5,-3.3,-1.1,1.1,3.3,5.5]){
 runway.add(mesh(new THREE.BoxGeometry(.07,.03,190),new THREE.MeshBasicMaterial({color:x<0?0x892cff:0x08d8ff,transparent:true,opacity:.76}),x,-3.67,-86));
}
const pulseFloor=new THREE.MeshBasicMaterial({color:0xff35bc,transparent:true,opacity:.6});
const floorBars=[];
for(let i=0;i<18;i++){const bar=mesh(new THREE.BoxGeometry(12,.035,.13),pulseFloor,0,-3.65,-i*11);runway.add(bar);floorBars.push(bar);}
// Distant starfield and moving light strips make forward travel visible.
const starPositions=new Float32Array(540*3);
for(let i=0;i<540;i++){const j=i*3;starPositions[j]=(Math.random()-.5)*55;starPositions[j+1]=(Math.random()-.5)*36;starPositions[j+2]=-Math.random()*190;}
const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0x8acaff,size:.17,transparent:true,opacity:.72,sizeAttenuation:true}));scene.add(stars);
const laneGuides=[];for(const x of [-4.4,-2.2,0,2.2,4.4]){const guide=mesh(new THREE.BoxGeometry(.055,.025,185),new THREE.MeshBasicMaterial({color:x===0?0x14c8f9:0x6537bd,transparent:true,opacity:.35}),x,-3.62,-83);scene.add(guide);laneGuides.push(guide);}
const tunnelCore=mesh(new THREE.CylinderGeometry(8.85,8.85,185,8,1,true),new THREE.MeshBasicMaterial({color:0x091333,side:THREE.BackSide,transparent:true,opacity:.22}),0,0,-83,Math.PI/2);scene.add(tunnelCore);
const ship=new THREE.Group();scene.add(ship);ship.position.set(0,-2.1,1.1);
function mesh(geometry,material,x=0,y=0,z=0,rx=0,ry=0,rz=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);return o;}
// Low-poly fighter: forward nose points toward negative Z, with swept wings and twin engines.
const hull=mesh(new THREE.ConeGeometry(.72,3.5,6),dark,0,0,-.55,-Math.PI/2);ship.add(hull);
ship.add(mesh(new THREE.BoxGeometry(1.05,.36,2.3),cyan,0,-.04,.25));
const canopy=mesh(new THREE.SphereGeometry(.47,14,10),violet,0,.32,-.5);canopy.scale.set(.85,.55,1.55);ship.add(canopy);
function wing(side){const shape=new THREE.Shape();shape.moveTo(.25,-1.1);shape.lineTo(2.35,.85);shape.lineTo(2.4,1.48);shape.lineTo(.25,.9);shape.closePath();const geo=new THREE.ShapeGeometry(shape);const wingMesh=mesh(geo,dark);wingMesh.rotation.x=-Math.PI/2;wingMesh.scale.x=side;wingMesh.position.y=-.19;ship.add(wingMesh);ship.add(mesh(new THREE.BoxGeometry(1.75,.07,.1),cyan,side*1.38,-.16,1.05));}
wing(1);wing(-1);
for(const x of [-1.2,1.2]){ship.add(mesh(new THREE.CylinderGeometry(.29,.38,1.7,12),dark,x,-.27,.82,Math.PI/2));ship.add(mesh(new THREE.TorusGeometry(.3,.075,8,16),cyan,x,-.27,1.64));ship.add(mesh(new THREE.SphereGeometry(.22,12,10),cyan,x,-.27,1.7));}
const flame=mesh(new THREE.ConeGeometry(.4,2.3,12),new THREE.MeshBasicMaterial({color:0x00eaff,transparent:true,opacity:.7}),0,-.22,2.2,Math.PI/2);ship.add(flame);
// Fighter detail pass: layered armored fuselage, illuminated rails and twin exhaust plumes.
const armor=mat(0x172b54,0x0a2b50,.36),edgeGlow=new THREE.MeshBasicMaterial({color:0x49ecff});
ship.add(mesh(new THREE.BoxGeometry(1.38,.19,1.9),armor,0,-.23,.15));
ship.add(mesh(new THREE.BoxGeometry(.14,.13,2.55),edgeGlow,-.58,.08,-.23));
ship.add(mesh(new THREE.BoxGeometry(.14,.13,2.55),edgeGlow,.58,.08,-.23));
ship.add(mesh(new THREE.ConeGeometry(.34,1.5,4),cyan,0,.02,-2.25,-Math.PI/2));
for(const side of [-1,1]){
 ship.add(mesh(new THREE.BoxGeometry(.17,.13,1.5),edgeGlow,side*1.82,-.13,.68));
 ship.add(mesh(new THREE.BoxGeometry(.46,.27,.78),armor,side*1.17,.12,.72));
 ship.add(mesh(new THREE.BoxGeometry(.19,.56,.68),pink,side*1.3,.38,1.03));
 const exhaust=mesh(new THREE.ConeGeometry(.25,1.35,10),new THREE.MeshBasicMaterial({color:0x23eaff,transparent:true,opacity:.68,depthWrite:false}),side*1.2,-.27,2.37,Math.PI/2);ship.add(exhaust);
}
const shipGlow=new THREE.PointLight(0x00ccff,9,9);shipGlow.position.set(0,-.4,2);ship.add(shipGlow);
const objects=[];let running=false,paused=false,score=0,health=3,combo=0,elapsed=0,last=0,beatIndex=0,spawnBeat=0,invulnerable=0,desiredX=0,desiredY=-2.1,muted=false,audio=null,master=null,nextNote=0,note=0;
const bpm=132,beat=60/bpm;const track=new Audio('./makar-zhenya-soundtrack.mp3?v=2');track.preload='auto';track.loop=true;track.volume=1;let trackAvailable=false;
const trackButton=document.createElement('button');trackButton.id='track-control';trackButton.type='button';trackButton.textContent='♫ ВКЛЮЧИТЬ ТРЕК';document.body.appendChild(trackButton);
function trackLabel(label){trackButton.textContent=label;}
function startTrack(){track.muted=muted;return track.play().then(()=>{trackAvailable=true;trackLabel(muted?'♪ ТРЕК БЕЗ ЗВУКА':'♫ VITTY ИГРАЕТ');if(master&&audio)master.gain.setTargetAtTime(0,audio.currentTime,.02);}).catch(e=>{trackAvailable=false;trackLabel('♫ НАЖМИ: ЗАПУСТИТЬ ТРЕК');console.warn('MP3 playback failed',e);});}
track.addEventListener('playing',()=>{trackAvailable=true;trackLabel(muted?'♪ ТРЕК БЕЗ ЗВУКА':'♫ VITTY ИГРАЕТ');});
track.addEventListener('waiting',()=>trackLabel('♫ ЗАГРУЗКА МУЗЫКИ…'));
track.addEventListener('error',()=>{trackAvailable=false;trackLabel('⚠ MP3 НЕ ЗАГРУЖЕН');});
trackButton.addEventListener('click',()=>{if(muted){muted=false;mute.textContent='♫';track.muted=false;}startTrack();});const collisionZ=3;
// Integrate the accelerating tunnel speed exactly, so objects never jump when speed changes.
function distanceBetween(t0,t1){if(t1<=t0)return 0;const cap=35/.45;const f=t=>33*t+.225*t*t;return t0>=cap?68*(t1-t0):t1<=cap?f(t1)-f(t0):f(cap)-f(t0)+68*(t1-cap);}function distanceAt(t){return distanceBetween(0,Math.max(0,t));}let audioStart=0;let nextSpawnTime=0;let beatPulse=0;let beatZero=0;let lastBeatVisual=-1;let nextObstacleIndex=0;let runId=0;let perfTime=0,perfFrames=0,perfCooldown=0;let lastKnownFps=60;let statusEl=document.querySelector('#status');let impactFlash=0;let cameraShake=0;let streak=0;let warningFlash=0;const impactLight=new THREE.PointLight(0xff276c,0,18);impactLight.position.set(0,-1,3);scene.add(impactLight);
function initAudio(){if(audio)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audio=new C();master=audio.createGain();master.gain.value=muted?0:.55;const limiter=audio.createDynamicsCompressor();limiter.threshold.value=-16;limiter.knee.value=8;limiter.ratio.value=10;limiter.attack.value=.003;limiter.release.value=.15;master.connect(limiter).connect(audio.destination);}function tone(time,freq,duration,type,vol,fall=0){if(!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,time);if(fall)osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq*fall),time+duration);gain.gain.setValueAtTime(vol,time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(gain).connect(master);osc.start(time);osc.stop(time+duration+.01);}
let noiseBuffer=null;function noiseHit(time,duration,volume,highpass=900){if(!audio||!master)return;if(!noiseBuffer){const length=Math.ceil(audio.sampleRate*.3);noiseBuffer=audio.createBuffer(1,length,audio.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=Math.random()*2-1;}const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=noiseBuffer;filter.type='highpass';filter.frequency.value=highpass;gain.gain.setValueAtTime(volume,time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);src.connect(filter).connect(gain).connect(master);src.start(time);src.stop(time+duration);}
function schedule(){if(trackAvailable&&!track.paused)return;if(!audio||audio.state!=='running'||!running||paused||nextNote<=0)return;while(nextNote<audio.currentTime+.13){const n=note++,t=nextNote;const step=n%16;if(step%4===0)tone(t,145,.26,'sine',.72,.32);if(step%4===2){noiseHit(t,.14,.2,650);tone(t,195,.07,'triangle',.08,.6);}if(step%2===1)noiseHit(t,.045,.09,4300);if(step===4||step===12)tone(t,700,.07,'triangle',.05,.5);if(step%4===0){const bass=[55,55,65.4,49][Math.floor(n/4)%4];tone(t+.055,bass,.19,'sawtooth',.08,.75);}if(step%8===7)noiseHit(t,.12,.065,2800);nextNote+=beat/4;}}
function clearObjects(){for(const o of objects){o.mesh.parent?.remove(o.mesh);o.mesh.traverse(n=>{if(n.geometry)n.geometry.dispose();});}objects.length=0;}
function startGame(){const thisRun=++runId;clearObjects();running=true;paused=false;score=0;health=3;combo=0;elapsed=0;last=0;beatIndex=0;spawnBeat=0;nextObstacleIndex=0;nextSpawnTime=beat*8;beatPulse=0;beatZero=0;lastBeatVisual=-1;invulnerable=0;impactFlash=0;cameraShake=0;streak=0;warningFlash=0;desiredX=0;desiredY=-2.1;padTouch=null;ship.visible=true;ship.position.set(0,-2.1,3);document.body.classList.add('running');track.currentTime=0;track.muted=muted;startTrack().then(()=>{if(thisRun!==runId||!running)track.pause();});initAudio();if(master&&audio)master.gain.setTargetAtTime(muted||trackAvailable?0:.55,audio.currentTime,.03);nextNote=0;audio?.resume().then(()=>{if(thisRun!==runId||!running)return;nextNote=audio.currentTime+.08;note=0;audioStart=nextNote;beatZero=audioStart;}).catch(()=>{});updateHud();}
function multiplier(){return 1+Math.min(3,Math.floor(streak/8));}
function updateHud(){scoreEl.textContent=String(Math.floor(score)).padStart(6,'0');comboEl.textContent='x'+multiplier();healthEl.textContent='♥ '.repeat(health);}
// Lightweight animated rave dancers are collectibles; obstacles remain dangerous.
// Animated cyber-ravers: separate hips, shoulders, head and limbs for readable silhouettes.
// Stylized cyberpunk dancers inspired by the neon-rave reference: hair, jackets,
// articulated limbs, luminous shoes, stage pads, and individually choreographed moves.
function makeDancer(index){
 const dancer=new THREE.Group(),variant=Math.floor(index/4)%4;
 const colors=[0x00f4ff,0xff39c7,0xffb62b,0x9c6aff],color=colors[variant];
 const glow=new THREE.MeshBasicMaterial({color}),white=new THREE.MeshBasicMaterial({color:0xd8faff});
 const coat=new THREE.MeshStandardMaterial({color:variant===1?0x401d60:0x101e3b,emissive:color,emissiveIntensity:.36,metalness:.35,roughness:.45});
 const pants=new THREE.MeshStandardMaterial({color:0x12182e,metalness:.3,roughness:.65});
 const skin=new THREE.MeshStandardMaterial({color:variant===2?0x9a604a:0xe4b38f,roughness:.83});
 const hips=new THREE.Group();hips.position.y=.13;dancer.add(hips);
 const torso=new THREE.Group();torso.position.y=.49;hips.add(torso);
 torso.add(mesh(new THREE.BoxGeometry(.76,.8,.42),coat,0,0,0));
 torso.add(mesh(new THREE.BoxGeometry(.14,.72,.45),glow,0,.02,-.02));
 for(const side of [-1,1]){
  torso.add(mesh(new THREE.BoxGeometry(.13,.82,.5),glow,side*.36,0,-.01));
  torso.add(mesh(new THREE.BoxGeometry(.17,.22,.53),white,side*.39,.29,0));
 }
 const headPivot=new THREE.Group();headPivot.position.y=.55;torso.add(headPivot);
 headPivot.add(mesh(new THREE.SphereGeometry(.29,12,10),skin,0,.31,0));
 headPivot.add(mesh(new THREE.BoxGeometry(.64,.17,.17),glow,0,.34,-.27));
 // Spiky neon hair or long flowing hair: silhouette is visible even at distance.
 if(variant%2===0){
  for(let i=-2;i<=2;i++)headPivot.add(mesh(new THREE.ConeGeometry(.13,.47+(.08*Math.abs(i)),6),coat,i*.13,.69,.02,0,0,i*.2));
 }else{
  headPivot.add(mesh(new THREE.SphereGeometry(.35,10,8),coat,0,.57,.06));
  for(const side of [-1,1]){const hair=mesh(new THREE.CapsuleGeometry(.13,.55,3,6),glow,side*.32,.1,.09);hair.rotation.z=side*.25;headPivot.add(hair);}
 }
 for(const side of [-1,1]){
  headPivot.add(mesh(new THREE.CylinderGeometry(.17,.17,.11,10),glow,side*.31,.32,0,0,0,Math.PI/2));
 }
 const arms=[],forearms=[],legs=[],shins=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.47,.29,0);torso.add(arm);
  arm.add(mesh(new THREE.CylinderGeometry(.17,.14,.53,8),coat,0,-.26,0));
  const elbow=new THREE.Group();elbow.position.y=-.52;arm.add(elbow);
  elbow.add(mesh(new THREE.CylinderGeometry(.12,.1,.46,8),coat,0,-.22,0));
  elbow.add(mesh(new THREE.BoxGeometry(.27,.13,.28),glow,0,-.41,0));
  elbow.add(mesh(new THREE.SphereGeometry(.12,8,6),skin,0,-.52,0));arms.push(arm);forearms.push(elbow);
  const leg=new THREE.Group();leg.position.set(side*.22,-.05,0);hips.add(leg);
  leg.add(mesh(new THREE.CylinderGeometry(.2,.17,.48,8),pants,0,-.25,0));
  const knee=new THREE.Group();knee.position.y=-.49;leg.add(knee);
  knee.add(mesh(new THREE.CylinderGeometry(.17,.13,.42,8),pants,0,-.2,0));
  knee.add(mesh(new THREE.BoxGeometry(.29,.13,.29),glow,0,-.36,0));
  knee.add(mesh(new THREE.BoxGeometry(.36,.18,.56),white,0,-.46,-.15));legs.push(leg);shins.push(knee);
 }
 const pad=mesh(new THREE.CylinderGeometry(.88,.88,.055,24),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75,depthWrite:false}),0,-.9,0);dancer.add(pad);
 const ring=mesh(new THREE.TorusGeometry(.94,.065,6,24),glow,0,-.86,0,Math.PI/2);dancer.add(ring);
 dancer.scale.setScalar(1.65);
 dancer.userData={arms,forearms,legs,shins,headPivot,torso,hips,halo:ring,style:variant};
 return dancer;
}
function addObstacle(index,arrivalBeat){const patterns=[[0,2,-2,1,-1],[-2,0,2,-1,1],[2,1,0,-1,-2],[0,-2,2,-1,1]];const section=Math.floor(index/16)%patterns.length;const lane=patterns[section][index%5];const isGem=index%4===1;const group=new THREE.Group();let hitRadius=.9;let dancer=null;if(isGem){dancer=makeDancer(index);group.add(dancer);hitRadius=1.55;}else if(index%4===0){group.add(mesh(new THREE.TorusGeometry(1.08,.23,8,8),pink,0,0,0,0,0,Math.PI/8));group.add(mesh(new THREE.OctahedronGeometry(.65,0),violet));hitRadius=1.03;}else if(index%4===1){for(const x of [-.77,.77])group.add(mesh(new THREE.BoxGeometry(.24,2.65,.5),pink,x,0,0));group.add(mesh(new THREE.BoxGeometry(1.75,.24,.55),cyan,0,1.24,0));hitRadius=.98;}else if(index%4===2){group.add(mesh(new THREE.OctahedronGeometry(1.15,0),pink));group.add(mesh(new THREE.TorusGeometry(.86,.07,6,6),cyan));hitRadius=1.02;}else{group.add(mesh(new THREE.BoxGeometry(1.65,2.5,.65),pink));group.add(mesh(new THREE.BoxGeometry(1.9,.12,.85),cyan,0,1.28,0));}group.position.set(lane*2.2,-2.05,-110);scene.add(group);objects.push({mesh:group,gem:isGem,dancer,r:hitRadius,passed:false,arrivalBeat});}
function finish(){running=false;track.pause();runId++;document.body.classList.remove('running');let saved=0;try{saved=Number(localStorage.getItem('makar-zhenya-3d-best')||0)||0;}catch{}const best=Math.max(score,saved);try{localStorage.setItem('makar-zhenya-3d-best',String(Math.floor(best)));}catch{}message.textContent='Счёт: '+Math.floor(score)+' · Рекорд: '+Math.floor(best)+' · Попробуй ещё раз!';play.textContent='ИГРАТЬ СНОВА →';screen.style.display='flex';if(master&&audio)master.gain.setTargetAtTime(0,audio.currentTime,.035);}
// Invisible bottom steering zone: five lanes with relative swipes and tap selection.
const touchPad=document.createElement('div');touchPad.id='steering-pad';touchPad.setAttribute('aria-label','Сенсорное управление кораблём');document.body.appendChild(touchPad);
let padTouch=null,downX=0,downLane=2,hasDragged=false;
function setLane(lane){const n=THREE.MathUtils.clamp(Math.round(lane),0,4);desiredX=(n-2)*2.2;}
function padDown(e){if(!running||paused||padTouch!==null)return;padTouch=e.pointerId;downX=e.clientX;downLane=Math.round(desiredX/2.2)+2;hasDragged=false;try{touchPad.setPointerCapture(e.pointerId);}catch{}e.preventDefault();}
function padMove(e){if(padTouch!==e.pointerId||!running)return;const dx=e.clientX-downX;if(Math.abs(dx)>9)hasDragged=true;const width=Math.max(1,touchPad.getBoundingClientRect().width);setLane(downLane+Math.round(dx/(width*.105)));e.preventDefault();}
function padEnd(e){if(padTouch!==e.pointerId)return;if(!hasDragged){const r=touchPad.getBoundingClientRect();setLane(Math.floor(5*THREE.MathUtils.clamp((e.clientX-r.left)/Math.max(1,r.width),0,.9999)));}padTouch=null;try{touchPad.releasePointerCapture(e.pointerId);}catch{}}
touchPad.addEventListener('pointerdown',padDown,{passive:false});touchPad.addEventListener('pointermove',padMove,{passive:false});touchPad.addEventListener('pointerup',padEnd);touchPad.addEventListener('pointercancel',padEnd);
window.addEventListener('blur',()=>{padTouch=null;});
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')desiredX=Math.max(-4.4,desiredX-1.1);if(e.key==='ArrowRight')desiredX=Math.min(4.4,desiredX+1.1);});
play.addEventListener('click',()=>{if(contextLost){location.reload();return;}screen.style.display='';startGame();});mute.addEventListener('click',()=>{muted=!muted;mute.textContent=muted?'♪̸':'♫';track.muted=muted;if(trackAvailable)trackLabel(muted?'♪ ТРЕК БЕЗ ЗВУКА':'♫ VITTY ИГРАЕТ');if(master&&audio)master.gain.setTargetAtTime(muted||(trackAvailable&&!track.paused)?0:.55,audio.currentTime,.012);});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{paused=document.hidden;last=0;if(audio){if(paused){track.pause();audio.suspend().catch(()=>{});}else if(running){if(trackAvailable)track.play().catch(()=>{});const activeRun=runId;audio.resume().then(()=>{if(!running||paused||activeRun!==runId)return;const currentStep=Math.max(0,Math.ceil((audio.currentTime-beatZero)/(beat/4)));note=currentStep;nextNote=beatZero+currentStep*(beat/4);}).catch(()=>{});}}});
function animate(t){requestAnimationFrame(animate);const dt=last?Math.min((t-last)/1000,.04):0;last=t;const active=running&&!paused&&!contextLost;if(active&&dt>0){perfTime+=dt;perfFrames++;perfCooldown=Math.max(0,perfCooldown-dt);if(perfTime>=3){const fps=perfFrames/perfTime;lastKnownFps=Math.round(fps);if(running)statusEl.textContent=(Math.floor(Math.max(0,elapsed)/beat/16)%2===0?'DRIVE':'HYPERDRIVE')+' · 132 BPM · '+lastKnownFps+' FPS';if(perfCooldown===0&&fps<43&&renderScale>0.9){renderScale=Math.max(.9,renderScale-.2);renderer.setPixelRatio(renderScale);perfCooldown=6;}else if(perfCooldown===0&&fps>57&&renderScale<Math.min(devicePixelRatio,1.7)){renderScale=Math.min(Math.min(devicePixelRatio,1.7),renderScale+.1);renderer.setPixelRatio(renderScale);perfCooldown=8;}perfTime=0;perfFrames=0;}}if(active){elapsed+=dt;score+=dt*15;schedule();const speed=33+Math.min(35,elapsed*.45);const rhythmTime=trackAvailable&&!track.paused?track.currentTime:(audio&&beatZero>0&&audio.state==='running'?Math.max(0,audio.currentTime-beatZero):elapsed);while(nextSpawnTime<rhythmTime-1){nextSpawnTime+=beat*2;spawnBeat++;}let spawnedThisFrame=0;while(nextSpawnTime>=rhythmTime-1&&distanceBetween(rhythmTime,nextSpawnTime)<=110+collisionZ&&spawnedThisFrame<24){addObstacle(spawnBeat++,nextSpawnTime);nextSpawnTime+=beat*2;spawnedThisFrame++;}beatPulse=Math.max(0,1-(rhythmTime%beat)/beat);const visualBeat=Math.floor(rhythmTime/beat);if(visualBeat!==lastBeatVisual){lastBeatVisual=visualBeat;statusEl.textContent=(Math.floor(visualBeat/16)%2===0?'DRIVE':'HYPERDRIVE')+' · 132 BPM · '+lastKnownFps+' FPS';}const tunnelDistance=distanceAt(rhythmTime);for(let i=0;i<rings.length;i++){rings[i].position.z=12-((tunnelDistance+4+i*7)%(rings.length*7));}for(let i=0;i<clubRibs.length;i++)clubRibs[i].position.z=8-((tunnelDistance+i*14)%(clubRibs.length*14));for(let i=0;i<floorBars.length;i++)floorBars[i].position.z=9-((tunnelDistance+i*11)%(floorBars.length*11));pulseFloor.opacity=.32+beatPulse*.5;for(let i=0;i<starPositions.length;i+=3){starPositions[i+2]+=dt*speed*.7;if(starPositions[i+2]>12)starPositions[i+2]-=190;}starGeometry.attributes.position.needsUpdate=true;ship.position.x=THREE.MathUtils.damp(ship.position.x,desiredX,32,dt);ship.rotation.z=THREE.MathUtils.damp(ship.rotation.z,-(desiredX-ship.position.x)*.13,8,dt);ship.rotation.y=THREE.MathUtils.damp(ship.rotation.y,-(desiredX-ship.position.x)*.08,8,dt);ship.position.y=-2.1+Math.sin(elapsed*3.5)*.07;ship.position.z=1.1;shipGlow.intensity=7+Math.pow(beatPulse,3)*10;flame.scale.y=1+Math.sin(elapsed*40)*.14;invulnerable=Math.max(0,invulnerable-dt);ship.visible=invulnerable===0||Math.sin(elapsed*28)>0;for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.mesh.position.z=collisionZ+(rhythmTime>=o.arrivalBeat?distanceBetween(o.arrivalBeat,rhythmTime):-distanceBetween(rhythmTime,o.arrivalBeat));if(o.gem&&o.dancer){const d=o.dancer.userData;const phase=rhythmTime*Math.PI*2/beat;const motion=phase+(d.style*1.7);d.arms[0].rotation.z=d.style===0?-1.8+Math.sin(motion)*.3:d.style===1?Math.sin(motion)*1.3-.8:-1.3+Math.sin(motion*2)*.7;d.arms[1].rotation.z=d.style===0?1.8+Math.cos(motion)*.3:d.style===1?-Math.sin(motion+1.1)*1.3+.8:1.3-Math.cos(motion*2)*.7;d.arms[0].rotation.x=Math.cos(motion)*.5;d.arms[1].rotation.x=-Math.cos(motion)*.5;d.legs[0].rotation.x=Math.sin(motion)*(d.style===2?.85:.55);d.legs[1].rotation.x=-Math.sin(motion)*(d.style===2?.85:.55);o.dancer.position.y=Math.abs(Math.sin(motion))*.22;o.dancer.rotation.y=Math.sin(motion*.5)*.24;d.torso.rotation.z=Math.sin(motion*.5)*.3;d.torso.rotation.x=Math.sin(motion)*.16;d.headPivot.rotation.y=Math.sin(motion*.75)*.48;d.hips.rotation.y=Math.sin(motion*.5)*.32;d.forearms[0].rotation.z=-.6+Math.sin(motion*1.3)*.7;d.forearms[1].rotation.z=.6-Math.cos(motion*1.3)*.7;d.shins[0].rotation.x=Math.max(0,Math.sin(motion))*.6;d.shins[1].rotation.x=Math.max(0,-Math.sin(motion))*.6;d.halo.rotation.z+=dt*.65;}else if(o.mesh.children.length)o.mesh.rotation.z=Math.sin(rhythmTime*2+o.arrivalBeat)*.12;if(!o.gem&&!o.passed&&o.arrivalBeat-rhythmTime>0&&o.arrivalBeat-rhythmTime<.55&&Math.abs(o.mesh.position.x-ship.position.x)<o.r+.6)warningFlash=Math.max(warningFlash,1-(o.arrivalBeat-rhythmTime)/.55);if(!o.passed&&rhythmTime>=o.arrivalBeat){o.passed=true;if(Math.abs(o.mesh.position.x-ship.position.x)<o.r+(o.gem?1.25:.6)){if(o.gem){streak++;score+=100*multiplier();combo+=2;if(streak>0&&streak%10===0){score+=500;trackLabel('RAVE COMBO +500');}trackLabel('✦ +100 РЕЙВЕР');setTimeout(()=>{if(running)trackLabel(track.paused?'♫ ВКЛЮЧИТЬ ТРЕК':'♫ VITTY ИГРАЕТ');},850);impactFlash=Math.max(impactFlash,.24);tg?.HapticFeedback?.selectionChanged?.();}else if(invulnerable<=0){health--;combo=0;streak=0;invulnerable=1.5;impactFlash=1;cameraShake=.3;tg?.HapticFeedback?.impactOccurred?.('medium');if(health<=0){finish();break;}}}else if(!o.gem){streak++;combo++;score+=10*multiplier();}updateHud();}if(o.mesh.position.z>18){scene.remove(o.mesh);o.mesh.traverse(n=>{if(n.geometry)n.geometry.dispose();});objects.splice(i,1);}}}
warningFlash=Math.max(0,warningFlash-dt*2.8);impactFlash=Math.max(0,impactFlash-dt*2.6);cameraShake=Math.max(0,cameraShake-dt*.85);impactLight.intensity=impactFlash*75+warningFlash*13;light.intensity=34+Math.pow(beatPulse,5)*42;camera.position.x=THREE.MathUtils.damp(camera.position.x,ship.position.x*.05,2,dt)+(Math.random()-.5)*cameraShake;camera.position.y=1.9+(Math.random()-.5)*cameraShake;if(!contextLost)renderer.render(scene,camera);}
requestAnimationFrame(animate);