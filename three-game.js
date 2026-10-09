import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const tg=window.Telegram?.WebApp;try{tg?.ready();tg?.expand();}catch{}
const root=document.querySelector('#viewport'),scoreEl=document.querySelector('#score'),comboEl=document.querySelector('#combo'),healthEl=document.querySelector('#health'),screen=document.querySelector('#screen'),message=document.querySelector('#message'),play=document.querySelector('#play'),mute=document.querySelector('#mute');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x030513);scene.fog=new THREE.FogExp2(0x030513,.007);
const camera=new THREE.PerspectiveCamera(69,innerWidth/innerHeight,.1,220);camera.position.set(0,1.9,11);camera.lookAt(0,0,-24);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});let renderScale=Math.min(devicePixelRatio,1.7);let contextLost=false;renderer.setPixelRatio(renderScale);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;root.appendChild(renderer.domElement);renderer.domElement.style.touchAction='none';renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;paused=true;last=0;audio?.suspend();message.textContent='Графический контекст потерян. Перезагрузи страницу для продолжения.';play.textContent='ПЕРЕЗАГРУЗИТЬ ↻';screen.style.display='flex';});
scene.add(new THREE.HemisphereLight(0x7bbaff,0x08041c,2.1));const light=new THREE.PointLight(0x00dfff,45,30);light.position.set(0,3,5);scene.add(light);
const mat=(color,emissive=color,intensity=.65)=>new THREE.MeshStandardMaterial({color,metalness:.65,roughness:.26,emissive,emissiveIntensity:intensity,side:THREE.DoubleSide});
const cyan=mat(0x20dbff),pink=mat(0xff287e),violet=mat(0x7840ff),dark=mat(0x101d39,0x061123,.18),gold=mat(0xffcf5a);
// Unified forward-moving rave tunnel. All architecture shares the same travel direction.
const tunnel=new THREE.Group();scene.add(tunnel);
const neonBlue=new THREE.MeshBasicMaterial({color:0x16dcff,transparent:true,opacity:.86});
const neonMagenta=new THREE.MeshBasicMaterial({color:0xff30c4,transparent:true,opacity:.86});
const neonViolet=new THREE.MeshBasicMaterial({color:0x8755ff,transparent:true,opacity:.83});
const wallDark=new THREE.MeshBasicMaterial({color:0x0d0b28,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false});
const rings=[],clubRibs=[],floorBars=[];
const tunnelRadius=11.6,segments=8;
const ribGeo=new THREE.BoxGeometry(.18,.19,.27);
const railGeo=new THREE.BoxGeometry(.11,.1,10);
function edgeBetween(a,b,material,thickness=.13){
 const delta=new THREE.Vector3().subVectors(b,a),m=new THREE.Mesh(new THREE.BoxGeometry(thickness,delta.length(),.24),material);
 m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());return m;
}
for(let i=0;i<24;i++){
 const g=new THREE.Group();g.position.z=10-i*8;
 const hue=i%8,material=hue===0?neonMagenta:hue===4?neonViolet:neonBlue;
 for(let k=0;k<segments;k++){
  const a=Math.PI/8+k*Math.PI*2/segments,b=Math.PI/8+(k+1)*Math.PI*2/segments;
  const p=new THREE.Vector3(Math.cos(a)*tunnelRadius,Math.sin(a)*tunnelRadius+1,0);
  const q=new THREE.Vector3(Math.cos(b)*tunnelRadius,Math.sin(b)*tunnelRadius+1,0);
  g.add(edgeBetween(p,q,material,i%4===0?.24:.13));
  if(i%3===0&&k>=1&&k<=2){
   const center=p.clone().add(q).multiplyScalar(.5);
   const inset=center.clone().multiplyScalar(.78);inset.z=-.35;
   g.add(edgeBetween(p,inset,neonViolet,.08),edgeBetween(inset,q,neonMagenta,.08));
  }
 }
 if(i%3===0){
  for(const side of [-1,1]){
   g.add(mesh(new THREE.BoxGeometry(.18,5,.24),neonMagenta,side*10.2,1.2,0));
   g.add(mesh(new THREE.PlaneGeometry(2.3,4.5),wallDark,side*10.6,2.3,-.1,0,side*Math.PI/2));
  }
 }
 tunnel.add(g);rings.push(g);
}
for(let k=0;k<8;k++){
 const a=Math.PI/8+k*Math.PI/4;
 const x=Math.cos(a)*tunnelRadius,y=Math.sin(a)*tunnelRadius+1;
 const rail=mesh(new THREE.BoxGeometry(.095,.095,190),k%2?neonViolet:neonBlue,x,y,-83);
 tunnel.add(rail);
}
const runway=new THREE.Group();scene.add(runway);
const floorMat=new THREE.MeshBasicMaterial({color:0x11102f,transparent:true,opacity:.84,side:THREE.DoubleSide,depthWrite:false});
runway.add(mesh(new THREE.PlaneGeometry(14.3,195),floorMat,0,-3.72,-86,-Math.PI/2));
for(const x of [-5.5,-3.3,-1.1,1.1,3.3,5.5]){
 runway.add(mesh(new THREE.BoxGeometry(.075,.04,190),x<0?neonViolet:neonBlue,x,-3.66,-86));
}
const pulseFloor=new THREE.MeshBasicMaterial({color:0xff3cb9,transparent:true,opacity:.65});
for(let i=0;i<18;i++){
 const bar=mesh(new THREE.BoxGeometry(13.6,.045,.16),pulseFloor,0,-3.63,-i*11);
 runway.add(bar);floorBars.push(bar);
}
const ceilingGlow=new THREE.PointLight(0xd33cff,17,22);ceilingGlow.position.set(0,7,-15);scene.add(ceilingGlow);
// Premium club ceiling: structural beams, light bars and holographic dance-floor screens.
const clubDecor=[];
const steel=new THREE.MeshStandardMaterial({color:0x171b37,metalness:.82,roughness:.3});
const amberLight=new THREE.MeshBasicMaterial({color:0xffa45b});
const screenMat=new THREE.MeshBasicMaterial({color:0x31136d,side:THREE.DoubleSide});
const displayCyan=new THREE.MeshBasicMaterial({color:0x00f0ff,side:THREE.DoubleSide});
for(let i=0;i<12;i++){
 const module=new THREE.Group();module.position.z=-i*16;
 // Thick industrial trusswork makes the tunnel read as a real venue.
 for(const side of [-1,1]){
  module.add(mesh(new THREE.BoxGeometry(.45,8.5,.8),steel,side*10.6,2.3,0));
  module.add(mesh(new THREE.BoxGeometry(1.25,.16,.85),amberLight,side*9.9,6.4,0));
  const screen=mesh(new THREE.PlaneGeometry(2.6,4.5),screenMat,side*10.05,1.7,-.1,0,side*Math.PI/2);
  module.add(screen);
  for(let k=0;k<4;k++)module.add(mesh(new THREE.BoxGeometry(.15,.25+k*.25,.1),displayCyan,side*(9.7+k*.16),1.1,side*.07));
 }
 module.add(mesh(new THREE.BoxGeometry(20.7,.52,.75),steel,0,8.4,0));
 for(let x=-8;x<=8;x+=4)module.add(mesh(new THREE.BoxGeometry(1.4,.14,.8),i%3===0?neonMagenta:neonBlue,x,8.03,0));
 clubDecor.push(module);tunnel.add(module);
}
// Reflective-looking runway highlights, lightweight for mobile WebGL.
const floorShine=new THREE.MeshBasicMaterial({color:0x172d68,transparent:true,opacity:.36,side:THREE.DoubleSide,depthWrite:false});
runway.add(mesh(new THREE.PlaneGeometry(10.7,195),floorShine,0,-3.695,-86,-Math.PI/2));
const edgeLight=new THREE.MeshBasicMaterial({color:0xff3bc9,transparent:true,opacity:.9});
for(const x of [-6.7,6.7])runway.add(mesh(new THREE.BoxGeometry(.21,.05,190),edgeLight,x,-3.61,-86));

// Architectural depth: illuminated inner wall ribs and overhead light panels.
const wallPanels=[],panelBlue=new THREE.MeshBasicMaterial({color:0x173f82,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false});
const panelPink=new THREE.MeshBasicMaterial({color:0x702057,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false});
for(let i=0;i<16;i++){
 const group=new THREE.Group();group.position.z=-i*12;
 for(const side of [-1,1]){
  const panel=mesh(new THREE.PlaneGeometry(5.4,5.8),i%4===0?panelPink:wallPanels.length%2?panelBlue:panelPink,side*10.7,2.2,0,0,side*Math.PI/2);
  group.add(panel);
  group.add(mesh(new THREE.BoxGeometry(.12,4.6,.2),i%3===0?neonMagenta:neonViolet,side*10.4,2.3,0));
  group.add(mesh(new THREE.BoxGeometry(2.2,.13,.2),neonBlue,side*9.6,5.4,0));
 }
 group.add(mesh(new THREE.BoxGeometry(3.8,.18,.34),i%3===0?neonMagenta:neonBlue,0,9.7,0));
 tunnel.add(group);wallPanels.push(group);
}
const laserMaterialA=new THREE.MeshBasicMaterial({color:0x00edff,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending});
const laserMaterialB=new THREE.MeshBasicMaterial({color:0xff31b5,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending});
const laserBeams=[],laserFixtures=[];
for(let i=0;i<12;i++){
 const side=i%2===0?-1:1;
 const pivot=new THREE.Group();pivot.position.set(side*10.4,5.5,-i*16-6);tunnel.add(pivot);
 pivot.add(mesh(new THREE.BoxGeometry(.6,.4,.75),new THREE.MeshBasicMaterial({color:0x25224f}),0,0,0));
 const beam=mesh(new THREE.CylinderGeometry(.035,.09,16,5,1,true),i%3===0?laserMaterialB:laserMaterialA,0,-7.7,0);
 pivot.add(beam);laserBeams.push({pivot,side,index:i});laserFixtures.push(pivot);
}
const lightWave=new THREE.MeshBasicMaterial({color:0x70d9ff,transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending});
const waveRings=[];
for(let i=0;i<6;i++){
 const wave=new THREE.Mesh(new THREE.TorusGeometry(8.4,.075,5,32),lightWave.clone());
 wave.position.set(0,1,-i*30-18);tunnel.add(wave);waveRings.push(wave);
}

// Distant starfield and moving light strips make forward travel visible.
const starPositions=new Float32Array(540*3);
for(let i=0;i<540;i++){const j=i*3;starPositions[j]=(Math.random()-.5)*55;starPositions[j+1]=(Math.random()-.5)*36;starPositions[j+2]=-Math.random()*190;}
const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0x8acaff,size:.17,transparent:true,opacity:.72,sizeAttenuation:true}));scene.add(stars);
const laneGuides=[];for(const x of [-4.4,-2.2,0,2.2,4.4]){const guide=mesh(new THREE.BoxGeometry(.055,.025,185),new THREE.MeshBasicMaterial({color:x===0?0x14c8f9:0x6537bd,transparent:true,opacity:.35}),x,-3.62,-83);scene.add(guide);laneGuides.push(guide);}
const tunnelCore=mesh(new THREE.CylinderGeometry(11.8,11.8,185,8,1,true),new THREE.MeshBasicMaterial({color:0x091333,side:THREE.BackSide,transparent:true,opacity:.22}),0,0,-83,Math.PI/2);scene.add(tunnelCore);
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
function startGame(){const thisRun=++runId;clearObjects();running=true;paused=false;score=0;health=3;combo=0;elapsed=0;last=0;beatIndex=0;spawnBeat=0;nextObstacleIndex=0;nextSpawnTime=beat*8;beatPulse=0;beatZero=0;lastBeatVisual=-1;invulnerable=0;impactFlash=0;cameraShake=0;streak=0;warningFlash=0;desiredX=0;desiredY=-2.1;padTouch=null;ship.visible=true;ship.position.set(0,-2.1,1.1);for(const burst of pickupBursts){scene.remove(burst.group);burst.material.dispose();}pickupBursts.length=0;document.body.classList.add('running');track.currentTime=0;track.muted=muted;startTrack().then(()=>{if(thisRun!==runId||!running)track.pause();});initAudio();if(master&&audio)master.gain.setTargetAtTime(muted||trackAvailable?0:.55,audio.currentTime,.03);nextNote=0;audio?.resume().then(()=>{if(thisRun!==runId||!running)return;nextNote=audio.currentTime+.08;note=0;audioStart=nextNote;beatZero=audioStart;}).catch(()=>{});updateHud();}
function multiplier(){return 1+Math.min(3,Math.floor(streak/8));}
function updateHud(){scoreEl.textContent=String(Math.floor(score)).padStart(6,'0');comboEl.textContent='x'+multiplier();healthEl.textContent='♥ '.repeat(health);}
// Lightweight animated rave dancers are collectibles; obstacles remain dangerous.
// Animated cyber-ravers: separate hips, shoulders, head and limbs for readable silhouettes.
// Stylized cyberpunk dancers inspired by the neon-rave reference: hair, jackets,
// articulated limbs, luminous shoes, stage pads, and individually choreographed moves.
// Procedural mobile-friendly texture artwork for recognizable collectible props.
function paintedTexture(draw,width=512,height=256){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const c=canvas.getContext('2d');draw(c,width,height);
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;
}
const bottleLabel=paintedTexture((c,w,h)=>{
 c.fillStyle='#14100e';c.fillRect(0,0,w,h);
 c.strokeStyle='#d9a851';c.lineWidth=12;c.strokeRect(18,16,w-36,h-32);
 c.strokeStyle='#f6d890';c.lineWidth=3;c.strokeRect(32,30,w-64,h-60);
 c.fillStyle='#f8e4b1';c.textAlign='center';c.font='bold 43px Georgia';c.fillText('OLD RAVE',w/2,88);
 c.font='bold 68px Georgia';c.fillText('WHISKY',w/2,161);
 c.font='25px Georgia';c.fillText('NEON CLUB  •  1988',w/2,215);
});
const cashTexture=paintedTexture((c,w,h)=>{
 c.fillStyle='#b2d6a2';c.fillRect(0,0,w,h);
 c.strokeStyle='#26593d';c.lineWidth=7;c.strokeRect(14,12,w-28,h-24);
 c.strokeRect(29,26,w-58,h-52);
 for(let i=0;i<12;i++){c.strokeStyle='rgba(35,92,57,.23)';c.lineWidth=2;c.beginPath();c.moveTo(i*48,0);c.lineTo(i*48-55,h);c.stroke();}
 c.fillStyle='#24563c';c.textAlign='center';c.font='bold 43px Georgia';c.fillText('100',68,66);c.fillText('100',w-70,h-24);
 c.beginPath();c.ellipse(w/2,h/2,73,91,0,0,Math.PI*2);c.strokeStyle='#24563c';c.lineWidth=9;c.stroke();
 c.font='bold 92px Georgia';c.fillText('$',w/2,h/2+30);
 c.font='bold 23px Georgia';c.fillText('UNITED STATES',w/2,33);
});
function makeDancer(index){
 const dancer=new THREE.Group(),variant=Math.floor(index/4)%4;
 const palette=[0xff4bd8,0x24eaff,0xffcf66,0xaf79ff],color=palette[variant];
 const neon=new THREE.MeshBasicMaterial({color}),silver=new THREE.MeshStandardMaterial({color:0xe0e9f4,metalness:.82,roughness:.2});
 const outfit=new THREE.MeshStandardMaterial({color:variant%2?0x139db6:0xa735a1,metalness:.78,roughness:.25,emissive:color,emissiveIntensity:.18});
 const skin=new THREE.MeshStandardMaterial({color:variant===2?0x986249:0xe3a47f,roughness:.74});
 const hairMat=new THREE.MeshStandardMaterial({color:variant%2?0x25131c:0x9b5e2e,metalness:.18,roughness:.65});
 const hips=new THREE.Group();hips.position.y=.1;dancer.add(hips);
 const torso=new THREE.Group();torso.position.y=.47;hips.add(torso);
 torso.add(mesh(new THREE.CylinderGeometry(.27,.37,.68,10),skin,0,0,0));
 torso.add(mesh(new THREE.CylinderGeometry(.36,.29,.3,10),outfit,0,.2,0));
 torso.add(mesh(new THREE.TorusGeometry(.27,.038,6,14),silver,0,.34,-.06));
 torso.add(mesh(new THREE.CylinderGeometry(.4,.37,.22,10),outfit,0,-.37,0));
 torso.add(mesh(new THREE.BoxGeometry(.7,.09,.3),neon,0,-.32,0));
 const headPivot=new THREE.Group();headPivot.position.y=.52;torso.add(headPivot);
 headPivot.add(mesh(new THREE.SphereGeometry(.27,14,10),skin,0,.31,0));
 headPivot.add(mesh(new THREE.SphereGeometry(.29,12,10),hairMat,0,.51,.08));
 headPivot.add(mesh(new THREE.BoxGeometry(.6,.15,.13),neon,0,.36,-.25));
 headPivot.add(mesh(new THREE.BoxGeometry(.23,.11,.08),silver,-.15,.37,-.31));
 headPivot.add(mesh(new THREE.BoxGeometry(.23,.11,.08),silver,.15,.37,-.31));
 for(const side of [-1,1]){
  const strand=mesh(new THREE.CapsuleGeometry(.115,.63,4,6),hairMat,side*.3,.1,.12);strand.rotation.z=side*.13;headPivot.add(strand);
  headPivot.add(mesh(new THREE.CylinderGeometry(.16,.16,.09,12),neon,side*.29,.35,.03,0,0,Math.PI/2));
 }
 const arms=[],forearms=[],legs=[],shins=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.4,.25,0);torso.add(arm);
  arm.add(mesh(new THREE.CapsuleGeometry(.115,.37,4,8),skin,0,-.29,0));
  const elbow=new THREE.Group();elbow.position.y=-.53;arm.add(elbow);
  elbow.add(mesh(new THREE.CapsuleGeometry(.09,.29,4,8),skin,0,-.21,0));
  elbow.add(mesh(new THREE.SphereGeometry(.12,8,6),silver,0,-.47,0));arms.push(arm);forearms.push(elbow);
  const leg=new THREE.Group();leg.position.set(side*.2,-.39,0);hips.add(leg);
  leg.add(mesh(new THREE.CapsuleGeometry(.17,.39,4,8),skin,0,-.31,0));
  const knee=new THREE.Group();knee.position.y=-.64;leg.add(knee);
  knee.add(mesh(new THREE.CylinderGeometry(.18,.16,.59,10),outfit,0,-.32,0));
  knee.add(mesh(new THREE.BoxGeometry(.34,.17,.52),silver,0,-.64,-.12));
  knee.add(mesh(new THREE.BoxGeometry(.34,.09,.53),neon,0,-.57,-.13));
  legs.push(leg);shins.push(knee);
 }
 const halo=mesh(new THREE.TorusGeometry(.95,.06,6,24),neon,0,-1.7,0,Math.PI/2);dancer.add(halo);
 dancer.scale.setScalar(1.8);
 dancer.userData={arms,forearms,legs,shins,headPivot,torso,hips,halo,style:variant};
 return dancer;
}
function makeWhiskyBottle(){
 const g=new THREE.Group();
 const amber=new THREE.MeshPhysicalMaterial({color:0xb76416,metalness:.06,roughness:.17,transparent:true,opacity:.9,clearcoat:1,clearcoatRoughness:.08});
 const glassEdge=new THREE.MeshBasicMaterial({color:0xffc15d,transparent:true,opacity:.7});
 const cap=new THREE.MeshStandardMaterial({color:0x18121c,metalness:.55,roughness:.25});
 const label=new THREE.MeshBasicMaterial({map:bottleLabel});
 g.add(mesh(new THREE.BoxGeometry(.92,1.44,.54),amber,0,0,0));
 g.add(mesh(new THREE.BoxGeometry(.96,.07,.58),glassEdge,0,-.71,0));
 g.add(mesh(new THREE.CylinderGeometry(.25,.31,.4,12),amber,0,.9,0));
 g.add(mesh(new THREE.CylinderGeometry(.24,.24,.29,12),cap,0,1.24,0));
 g.add(mesh(new THREE.PlaneGeometry(.81,.73),label,0,.08,-.285,0,Math.PI,0));
 for(const x of [-.39,.39])g.add(mesh(new THREE.BoxGeometry(.055,1.29,.06),glassEdge,x,0,-.29));
 g.scale.setScalar(1.45);return g;
}
function makeDollarRoll(){
 const g=new THREE.Group();
 const paper=new THREE.MeshStandardMaterial({map:cashTexture,side:THREE.DoubleSide,roughness:.72});
 const rim=new THREE.MeshBasicMaterial({color:0xcce3af});
 const rubber=new THREE.MeshBasicMaterial({color:0xdab257});
 // The banknote cylinder is aligned horizontally; the texture wraps around it.
 const roll=mesh(new THREE.CylinderGeometry(.43,.43,1.65,28,1,true),paper,0,0,0,0,0,Math.PI/2);
 g.add(roll);
 for(const x of [-.82,.82]){
  g.add(mesh(new THREE.TorusGeometry(.43,.065,8,28),rim,x,0,0,0,Math.PI/2));
  g.add(mesh(new THREE.TorusGeometry(.26,.05,8,24),rim,x+(x>0?.015:-.015),0,0,0,Math.PI/2));
 }
 for(const x of [-.21,.21])g.add(mesh(new THREE.TorusGeometry(.44,.055,8,24),rubber,x,0,0,0,Math.PI/2));
 g.rotation.z=-.27;g.rotation.y=.35;g.scale.setScalar(1.5);return g;
}
function addObstacle(index,arrivalBeat){const patterns=[[0,2,-2,1,-1],[-2,0,2,-1,1],[2,1,0,-1,-2],[0,-2,2,-1,1]];const section=Math.floor(index/16)%patterns.length;const lane=patterns[section][index%5];const isGem=index%4===1;const group=new THREE.Group();let hitRadius=.9;let dancer=null;let collectibleType=null;if(isGem){const kind=Math.floor(index/4)%3;collectibleType=kind===0?'raver':kind===1?'whisky':'dollars';if(kind===0){dancer=makeDancer(index);group.add(dancer);hitRadius=1.55;}else if(kind===1){group.add(makeWhiskyBottle());hitRadius=1.2;}else{group.add(makeDollarRoll());hitRadius=1.2;}}else if(index%4===0){group.add(mesh(new THREE.TorusGeometry(1.08,.23,8,8),pink,0,0,0,0,0,Math.PI/8));group.add(mesh(new THREE.OctahedronGeometry(.65,0),violet));hitRadius=1.03;}else if(index%4===1){for(const x of [-.77,.77])group.add(mesh(new THREE.BoxGeometry(.24,2.65,.5),pink,x,0,0));group.add(mesh(new THREE.BoxGeometry(1.75,.24,.55),cyan,0,1.24,0));hitRadius=.98;}else if(index%4===2){group.add(mesh(new THREE.OctahedronGeometry(1.15,0),pink));group.add(mesh(new THREE.TorusGeometry(.86,.07,6,6),cyan));hitRadius=1.02;}else{group.add(mesh(new THREE.BoxGeometry(1.65,2.5,.65),pink));group.add(mesh(new THREE.BoxGeometry(1.9,.12,.85),cyan,0,1.28,0));}group.position.set(lane*2.2,-2.05,-110);scene.add(group);objects.push({mesh:group,gem:isGem,dancer,collectibleType,r:hitRadius,passed:false,arrivalBeat});}
function finish(){running=false;track.pause();runId++;document.body.classList.remove('running');let saved=0;try{saved=Number(localStorage.getItem('makar-zhenya-3d-best')||0)||0;}catch{}const best=Math.max(score,saved);try{localStorage.setItem('makar-zhenya-3d-best',String(Math.floor(best)));}catch{}message.textContent='Счёт: '+Math.floor(score)+' · Рекорд: '+Math.floor(best)+' · Попробуй ещё раз!';play.textContent='ИГРАТЬ СНОВА →';screen.style.display='flex';if(master&&audio)master.gain.setTargetAtTime(0,audio.currentTime,.035);}
// Reusable pickup bursts: pooled meshes avoid allocations during gameplay.
const pickupBursts=[];const burstColors={raver:0x20f3ff,whisky:0xffb84c,dollars:0x65ff9e};
const burstGeometry=new THREE.OctahedronGeometry(.14,0);
function spawnPickupBurst(x,y,z,type){
 const color=burstColors[type]||0xffffff;
 const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});
 const group=new THREE.Group();group.position.set(x,y,z);
 for(let i=0;i<12;i++){
  const piece=new THREE.Mesh(burstGeometry,material);const a=i*Math.PI*2/12;
  piece.userData.vx=Math.cos(a)*(3+(i%3));piece.userData.vy=Math.sin(a)*(2.2+(i%2));piece.userData.vz=1.4+(i%4)*.5;group.add(piece);
 }
 scene.add(group);pickupBursts.push({group,material,life:.6});
}
function updatePickupBursts(dt){
 for(let i=pickupBursts.length-1;i>=0;i--){
  const p=pickupBursts[i];p.life-=dt;p.material.opacity=Math.max(0,p.life/.6);
  for(const piece of p.group.children){piece.position.x+=piece.userData.vx*dt;piece.position.y+=piece.userData.vy*dt;piece.position.z+=piece.userData.vz*dt;piece.rotation.y+=dt*8;}
  if(p.life<=0){scene.remove(p.group);p.material.dispose();pickupBursts.splice(i,1);}
 }
}
// Invisible bottom steering zone: five lanes with relative swipes and tap selection.
const touchPad=document.createElement('div');touchPad.id='steering-pad';touchPad.setAttribute('aria-label','Сенсорное управление кораблём');document.body.appendChild(touchPad);
let padTouch=null,downX=0,downLane=2,hasDragged=false;
function setLane(lane){const n=THREE.MathUtils.clamp(Math.round(lane),0,4);desiredX=(n-2)*2.2;}
function padDown(e){if(!running||paused||padTouch!==null)return;padTouch=e.pointerId;downX=e.clientX;downLane=Math.round(desiredX/2.2)+2;hasDragged=false;try{touchPad.setPointerCapture(e.pointerId);}catch{}e.preventDefault();}
function padMove(e){if(padTouch!==e.pointerId||!running)return;const dx=e.clientX-downX;if(Math.abs(dx)>9)hasDragged=true;const width=Math.max(1,touchPad.getBoundingClientRect().width);setLane(downLane+Math.round(dx/(width*.17)));e.preventDefault();}
function padEnd(e){if(padTouch!==e.pointerId)return;if(!hasDragged){const r=touchPad.getBoundingClientRect();setLane(Math.floor(5*THREE.MathUtils.clamp((e.clientX-r.left)/Math.max(1,r.width),0,.9999)));}padTouch=null;try{touchPad.releasePointerCapture(e.pointerId);}catch{}}
touchPad.addEventListener('pointerdown',padDown,{passive:false});touchPad.addEventListener('pointermove',padMove,{passive:false});touchPad.addEventListener('pointerup',padEnd);touchPad.addEventListener('pointercancel',padEnd);
window.addEventListener('blur',()=>{padTouch=null;});
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')setLane(Math.round(desiredX/2.2)+1);if(e.key==='ArrowRight')setLane(Math.round(desiredX/2.2)+3);});
play.addEventListener('click',()=>{if(contextLost){location.reload();return;}screen.style.display='';startGame();});mute.addEventListener('click',()=>{muted=!muted;mute.textContent=muted?'♪̸':'♫';track.muted=muted;if(trackAvailable)trackLabel(muted?'♪ ТРЕК БЕЗ ЗВУКА':'♫ VITTY ИГРАЕТ');if(master&&audio)master.gain.setTargetAtTime(muted||(trackAvailable&&!track.paused)?0:.55,audio.currentTime,.012);});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{paused=document.hidden;last=0;if(audio){if(paused){track.pause();audio.suspend().catch(()=>{});}else if(running){if(trackAvailable)track.play().catch(()=>{});const activeRun=runId;audio.resume().then(()=>{if(!running||paused||activeRun!==runId)return;const currentStep=Math.max(0,Math.ceil((audio.currentTime-beatZero)/(beat/4)));note=currentStep;nextNote=beatZero+currentStep*(beat/4);}).catch(()=>{});}}});
function animate(t){requestAnimationFrame(animate);const dt=last?Math.min((t-last)/1000,.04):0;last=t;const active=running&&!paused&&!contextLost;if(active&&dt>0){perfTime+=dt;perfFrames++;perfCooldown=Math.max(0,perfCooldown-dt);if(perfTime>=3){const fps=perfFrames/perfTime;lastKnownFps=Math.round(fps);if(running)statusEl.textContent=(Math.floor(Math.max(0,elapsed)/beat/16)%2===0?'DRIVE':'HYPERDRIVE')+' · 132 BPM · '+lastKnownFps+' FPS';if(perfCooldown===0&&fps<43&&renderScale>0.9){renderScale=Math.max(.9,renderScale-.2);renderer.setPixelRatio(renderScale);perfCooldown=6;}else if(perfCooldown===0&&fps>57&&renderScale<Math.min(devicePixelRatio,1.7)){renderScale=Math.min(Math.min(devicePixelRatio,1.7),renderScale+.1);renderer.setPixelRatio(renderScale);perfCooldown=8;}perfTime=0;perfFrames=0;}}if(active){elapsed+=dt;score+=dt*15;schedule();const speed=33+Math.min(35,elapsed*.45);const rhythmTime=trackAvailable&&!track.paused?track.currentTime:(audio&&beatZero>0&&audio.state==='running'?Math.max(0,audio.currentTime-beatZero):elapsed);while(nextSpawnTime<rhythmTime-1){nextSpawnTime+=beat*2;spawnBeat++;}let spawnedThisFrame=0;while(nextSpawnTime>=rhythmTime-1&&distanceBetween(rhythmTime,nextSpawnTime)<=110+collisionZ&&spawnedThisFrame<24){addObstacle(spawnBeat++,nextSpawnTime);nextSpawnTime+=beat*2;spawnedThisFrame++;}beatPulse=Math.max(0,1-(rhythmTime%beat)/beat);const visualBeat=Math.floor(rhythmTime/beat);if(visualBeat!==lastBeatVisual){lastBeatVisual=visualBeat;statusEl.textContent=(Math.floor(visualBeat/16)%2===0?'DRIVE':'HYPERDRIVE')+' · 132 BPM · '+lastKnownFps+' FPS';}const tunnelDistance=distanceAt(rhythmTime);for(let i=0;i<rings.length;i++)rings[i].position.z=12-(((i*8-tunnelDistance)%(rings.length*8)+(rings.length*8))%(rings.length*8));for(let i=0;i<floorBars.length;i++)floorBars[i].position.z=11-(((i*11-tunnelDistance)%(floorBars.length*11)+(floorBars.length*11))%(floorBars.length*11));pulseFloor.opacity=.35+beatPulse*.5;ceilingGlow.intensity=12+beatPulse*20;
for(let i=0;i<wallPanels.length;i++)wallPanels[i].position.z=12-(((i*12-tunnelDistance)%(wallPanels.length*12)+(wallPanels.length*12))%(wallPanels.length*12));
for(let i=0;i<clubDecor.length;i++)clubDecor[i].position.z=12-(((i*16-tunnelDistance)%(clubDecor.length*16)+(clubDecor.length*16))%(clubDecor.length*16));
for(const item of laserBeams){const fixture=item.pivot;fixture.position.z=12-(((item.index*16+6-tunnelDistance)%(laserBeams.length*16)+(laserBeams.length*16))%(laserBeams.length*16));fixture.rotation.z=item.side*(.25+Math.sin(rhythmTime*1.2+item.index*.8)*.35);fixture.rotation.x=Math.sin(rhythmTime*.9+item.index)*.18;}
laserMaterialA.opacity=.32+beatPulse*.52;laserMaterialB.opacity=.22+beatPulse*.6;
for(let i=0;i<waveRings.length;i++){const w=waveRings[i];w.position.z=10-(((i*30+18-tunnelDistance)%(waveRings.length*30)+(waveRings.length*30))%(waveRings.length*30));const pulse=1+beatPulse*.09;w.scale.set(pulse,pulse,1);w.material.opacity=.16+beatPulse*.55;}for(let i=0;i<starPositions.length;i+=3){starPositions[i+2]+=dt*speed*.7;if(starPositions[i+2]>12)starPositions[i+2]-=190;}starGeometry.attributes.position.needsUpdate=true;ship.position.x=THREE.MathUtils.damp(ship.position.x,desiredX,8.5,dt);ship.rotation.z=THREE.MathUtils.damp(ship.rotation.z,THREE.MathUtils.clamp(-(desiredX-ship.position.x)*.15,-.3,.3),7,dt);ship.rotation.y=THREE.MathUtils.damp(ship.rotation.y,THREE.MathUtils.clamp(-(desiredX-ship.position.x)*.12,-.25,.25),7,dt);ship.position.y=-2.1+Math.sin(elapsed*3.5)*.07;ship.position.z=1.1;shipGlow.intensity=7+Math.pow(beatPulse,3)*10;flame.scale.y=1+Math.sin(elapsed*40)*.14;invulnerable=Math.max(0,invulnerable-dt);ship.visible=invulnerable===0||Math.sin(elapsed*28)>0;for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.mesh.position.z=collisionZ+(rhythmTime>=o.arrivalBeat?distanceBetween(o.arrivalBeat,rhythmTime):-distanceBetween(rhythmTime,o.arrivalBeat));if(o.gem&&!o.dancer){o.mesh.rotation.y+=dt*1.4;o.mesh.position.y=-2.05+Math.sin(rhythmTime*4+o.arrivalBeat)*.18;}if(o.gem&&o.dancer){const d=o.dancer.userData;const phase=rhythmTime*Math.PI*2/beat;const motion=phase+(d.style*1.7);d.arms[0].rotation.z=d.style===0?-1.8+Math.sin(motion)*.3:d.style===1?Math.sin(motion)*1.3-.8:-1.3+Math.sin(motion*2)*.7;d.arms[1].rotation.z=d.style===0?1.8+Math.cos(motion)*.3:d.style===1?-Math.sin(motion+1.1)*1.3+.8:1.3-Math.cos(motion*2)*.7;d.arms[0].rotation.x=Math.cos(motion)*.5;d.arms[1].rotation.x=-Math.cos(motion)*.5;d.legs[0].rotation.x=Math.sin(motion)*(d.style===2?.85:.55);d.legs[1].rotation.x=-Math.sin(motion)*(d.style===2?.85:.55);o.dancer.position.y=Math.abs(Math.sin(motion))*.22;o.dancer.rotation.y=Math.sin(motion*.5)*.24;d.torso.rotation.z=Math.sin(motion*.5)*.3;d.torso.rotation.x=Math.sin(motion)*.16;d.headPivot.rotation.y=Math.sin(motion*.75)*.48;d.hips.rotation.y=Math.sin(motion*.5)*.32;d.forearms[0].rotation.z=-.6+Math.sin(motion*1.3)*.7;d.forearms[1].rotation.z=.6-Math.cos(motion*1.3)*.7;d.shins[0].rotation.x=Math.max(0,Math.sin(motion))*.6;d.shins[1].rotation.x=Math.max(0,-Math.sin(motion))*.6;d.halo.rotation.z+=dt*.65;}else if(!o.gem&&o.mesh.children.length)o.mesh.rotation.z=Math.sin(rhythmTime*2+o.arrivalBeat)*.12;if(!o.gem&&!o.passed&&o.arrivalBeat-rhythmTime>0&&o.arrivalBeat-rhythmTime<.55&&Math.abs(o.mesh.position.x-ship.position.x)<o.r+.6)warningFlash=Math.max(warningFlash,1-(o.arrivalBeat-rhythmTime)/.55);if(!o.passed&&rhythmTime>=o.arrivalBeat){o.passed=true;if(Math.abs(o.mesh.position.x-ship.position.x)<o.r+(o.gem?1.25:.6)){if(o.gem){spawnPickupBurst(o.mesh.position.x,o.mesh.position.y,o.mesh.position.z,o.collectibleType);streak++;score+=100*multiplier();combo+=2;if(streak>0&&streak%10===0){score+=500;trackLabel('RAVE COMBO +500');}trackLabel(o.collectibleType==='whisky'?'✦ +100 ВИСКИ':o.collectibleType==='dollars'?'✦ +100 ДОЛЛАРЫ':'✦ +100 РЕЙВЕР');setTimeout(()=>{if(running)trackLabel(track.paused?'♫ ВКЛЮЧИТЬ ТРЕК':'♫ VITTY ИГРАЕТ');},850);impactFlash=Math.max(impactFlash,.24);tg?.HapticFeedback?.selectionChanged?.();}else if(invulnerable<=0){health--;combo=0;streak=0;invulnerable=1.5;impactFlash=1;cameraShake=.3;tg?.HapticFeedback?.impactOccurred?.('medium');if(health<=0){finish();break;}}}else if(!o.gem){streak++;combo++;score+=10*multiplier();}updateHud();}if(o.mesh.position.z>18){scene.remove(o.mesh);o.mesh.traverse(n=>{if(n.geometry)n.geometry.dispose();});objects.splice(i,1);}}}
updatePickupBursts(active?dt:0);warningFlash=Math.max(0,warningFlash-dt*2.8);impactFlash=Math.max(0,impactFlash-dt*2.6);cameraShake=Math.max(0,cameraShake-dt*.85);impactLight.intensity=impactFlash*75+warningFlash*13;light.intensity=34+Math.pow(beatPulse,5)*42;camera.position.x=THREE.MathUtils.damp(camera.position.x,ship.position.x*.05,2,dt)+(Math.random()-.5)*cameraShake;camera.position.y=1.9+(Math.random()-.5)*cameraShake;if(!contextLost)renderer.render(scene,camera);}
requestAnimationFrame(animate);