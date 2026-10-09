import * as T from 'three';

function makePlanetMap(palette){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const g=canvas.getContext('2d');if(!g)return null;
 const gradient=g.createLinearGradient(0,0,0,256);
 gradient.addColorStop(0,palette[0]);gradient.addColorStop(.25,palette[1]);
 gradient.addColorStop(.53,palette[2]);gradient.addColorStop(.77,palette[1]);
 gradient.addColorStop(1,palette[0]);
 g.fillStyle=gradient;g.fillRect(0,0,512,256);
 // Layered atmospheric bands: deterministic multi-hued swirls, not a flat sphere.
 for(let j=0;j<110;j++){
  const y=(j*47.39)%255,phase=j*1.618;
  g.beginPath();
  for(let x=0;x<=512;x+=6){
   const yy=y+Math.sin(x*.015+phase)*7+Math.sin(x*.043+phase*.3)*2;
   x===0?g.moveTo(x,yy):g.lineTo(x,yy);
  }
  g.strokeStyle=j%3===0?'rgba(227,203,255,.12)':'rgba(19,26,67,.22)';
  g.lineWidth=1+(j%5)*.75;g.stroke();
 }
 for(let i=0;i<24;i++){
  const x=(i*101.73)%512,y=(i*73.77)%256,r=7+(i%5)*7;
  const grad=g.createRadialGradient(x,y,0,x,y,r);
  grad.addColorStop(0,i%2?'rgba(219,158,244,.35)':'rgba(102,224,254,.28)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);
 }
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;
 return map;
}
export function createCosmicBackdrop(scene){
 const sky=new T.Mesh(new T.SphereGeometry(390,40,22),new T.ShaderMaterial({
  side:T.BackSide,depthWrite:false,
  uniforms:{uTime:{value:0}},
  vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`precision highp float;varying vec3 vDir;uniform float uTime;
   float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float noise(vec3 p){
    vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
      mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
      mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
   }
   float fbm(vec3 p){
    float n=0.,amp=.5;
    for(int i=0;i<4;i++){n+=amp*noise(p);p=p*2.09+1.19;amp*=.5;}
    return n;
   }
   void main(){
    vec3 dir=normalize(vDir);
    float time=uTime*.008;
    float n=fbm(dir*5.+vec3(time,0.,0.));
    float turbulent=fbm(dir*11.-vec3(0.,time*.34,0.));
    float band=exp(-abs(dir.y+dir.x*.30+.10)*5.2);
    float clouds=pow(smoothstep(.24,.64,n),1.5)*band;
    float wisps=pow(smoothstep(.34,.70,turbulent),1.65)*band;
    float magenta=.5+.5*sin(9.*dir.x+dir.z*6.+n*8.);
    vec3 color=vec3(.004,.008,.022);
    color+=clouds*mix(vec3(.012,.13,.35),vec3(.25,.065,.37),magenta);
    color+=wisps*vec3(.035,.27,.30);
    color+=vec3(.035,.026,.11)*pow(band,3.)*.45;
    vec3 sid=floor(dir*720.);
    float star=step(.996,hash(sid));
    float shimmer=.74+.26*sin(uTime*.7+hash(sid)*15.);
    float hot=step(.9994,hash(sid+24.));
    color+=star*vec3(.52,.77,1.)*shimmer*.60+hot*vec3(1.,.65,.91)*.88;
    gl_FragColor=vec4(color,1.);
   }`
 }));scene.add(sky);
 const planetMat=new T.MeshStandardMaterial({
  map:makePlanetMap(['#211d48','#5b518b','#a07bad']),
  metalness:.05,roughness:.9
 });
 const planet=new T.Mesh(new T.SphereGeometry(17,48,32),planetMat);
 planet.position.set(36,26,-130);scene.add(planet);
 const ringMat=new T.MeshBasicMaterial({
  color:0xb58ee0,transparent:true,opacity:.66,depthWrite:false,side:T.DoubleSide
 });
 const ring=new T.Mesh(new T.RingGeometry(22,26,96),ringMat);
 ring.position.copy(planet.position);ring.rotation.set(.56,.14,.6);
 scene.add(ring);
 const planetFar=new T.Mesh(new T.SphereGeometry(10,32,20),
  new T.MeshStandardMaterial({
   map:makePlanetMap(['#0b263d','#1a5b73','#3b98a0']),roughness:.94
  }));
 planetFar.position.set(-46,13,-195);scene.add(planetFar);
 const stars=220;
 const positions=new Float32Array(stars*3);
 for(let i=0;i<stars;i++){
  // Seeded distribution for a stable picture after loading/restarts.
  const a=(i*6180339%997)/997,b=(i*44771%991)/991,c=(i*27183%983)/983;
  positions[i*3]=(a-.5)*175;
  positions[i*3+1]=(b-.5)*100+15;
  positions[i*3+2]=-30-c*225;
 }
 const field=new T.BufferGeometry();
 field.setAttribute('position',new T.BufferAttribute(positions,3));
 const dust=new T.Points(field,new T.PointsMaterial({
  color:0xb5e9ff,size:.65,transparent:true,opacity:.42,
  depthWrite:false,sizeAttenuation:true
 }));
 scene.add(dust);
 return {
  sky,planet,planetFar,
  update(beat,dt){
   sky.material.uniforms.uTime.value=beat*60/132;
   planet.rotation.y+=Math.min(dt,.05)*.004;
   planetFar.rotation.y-=Math.min(dt,.05)*.007;
   ring.rotation.z+=Math.min(dt,.05)*.003;
  }
 };
}
