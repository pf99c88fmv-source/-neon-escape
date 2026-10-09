// Festival clothing shader for the original skinned GLB: no skeleton or texture replacement.
export function styleRaverMaterial(source,T){
 if(!source?.isMeshStandardMaterial)return source;
 const material=source.clone();
 material.roughness=.61;material.metalness=.11;
 material.emissive=new T.Color(0x070b16);
 material.emissiveIntensity=.21;
 const oldCompile=material.onBeforeCompile;
 material.onBeforeCompile=shader=>{
  if(typeof oldCompile==='function')oldCompile(shader);
  shader.vertexShader=shader.vertexShader
   .replace('#include <common>','#include <common>\nvarying vec3 vRavePosition;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvRavePosition=position;');
  shader.fragmentShader=shader.fragmentShader
   .replace('#include <common>','#include <common>\nvarying vec3 vRavePosition;')
   .replace('#include <map_fragment>',`#include <map_fragment>
    // Recolor the original blue superhero suit directly via its texture
    // hue; preserve warm skin tones, face and hair on the shared rig.
    float blueSuit=smoothstep(.035,.18,diffuseColor.b-diffuseColor.r)
      *smoothstep(.015,.11,diffuseColor.g-diffuseColor.r);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.016,.021,.032),blueSuit*.93);
    // Precise techwear cuts and accents follow original mesh coordinates.
    float y=vRavePosition.y;
    float x=abs(vRavePosition.x);
    float jacket=smoothstep(.86,.97,y)*(1.-smoothstep(1.40,1.50,y))
       *(1.-smoothstep(.55,.76,x));
    float sleeves=smoothstep(.42,.52,x)*(1.-smoothstep(.86,1.03,x))
       *smoothstep(.97,1.08,y)*(1.-smoothstep(1.39,1.49,y));
    float trousers=smoothstep(.20,.29,y)*(1.-smoothstep(.93,1.02,y))
       *(1.-smoothstep(.48,.60,x));
    float shoes=(1.-smoothstep(.17,.28,y))*(1.-smoothstep(.55,.69,x));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.021,.023,.035),trousers*.98);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.012,.014,.022),clamp(jacket+sleeves,0.,1.)*.98);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.016,.019,.026),shoes*.98);
    // Rear/forward readable chevrons, asymmetrical jacket piping and shoe trim.
    float chest=smoothstep(.98,1.07,y)*(1.-smoothstep(1.33,1.40,y))
       *(1.-smoothstep(.42,.53,x));
    float chevron=1.-smoothstep(.017,.044,abs(y-(1.28-.49*x)));
    float piping=1.-smoothstep(.013,.040,abs(x-.28));
    float armBand=1.-smoothstep(.018,.040,abs(y-(1.22+.1*x)));
    float shoeEdge=1.-smoothstep(.015,.040,abs(y-.067));
    float cyan=clamp(chest*chevron*.67+jacket*piping*.45+
       sleeves*armBand*.33+shoes*shoeEdge*.52,0.,1.);
    float pink=trousers*(1.-smoothstep(.012,.042,abs(x-.35)))*.4;
    vec3 cyanColor=vec3(.04,.72,.87);
    vec3 pinkColor=vec3(.77,.18,.39);
    diffuseColor.rgb=mix(diffuseColor.rgb,cyanColor,cyan*.68);
    diffuseColor.rgb=mix(diffuseColor.rgb,pinkColor,pink);
    totalEmissiveRadiance+=cyanColor*cyan*.22+pinkColor*pink*.14;
`);
 };
 material.customProgramCacheKey=()=> 'cosmic-rave-techwear-4-suit-tone';
 material.needsUpdate=true;
 return material;
}
export function findRigBone(bones,keys){
 for(const key of keys){
  const target=key.toLowerCase().replace(/[^a-z0-9]/g,'');
  const bone=bones.find(b=>{
   const name=b.name.toLowerCase().replace(/[^a-z0-9]/g,'').replace(/^mixamorig/,'');
   return name===target||name.endsWith(target);
  });
  if(bone)return bone;
 }
 return null;
}
export function attachClubHeadphones(head,T){
 if(!head)return null;
 const group=new T.Group();
 const matte=new T.MeshStandardMaterial({color:0x101522,metalness:.65,roughness:.38});
 const neon=new T.MeshBasicMaterial({color:0x22d9ff});
 const arc=new T.Mesh(new T.TorusGeometry(.205,.021,7,20,Math.PI),matte);
 arc.position.y=.14;group.add(arc);
 for(const side of [-1,1]){
  const cup=new T.Mesh(new T.CylinderGeometry(.098,.098,.058,12),matte);
  cup.rotation.z=Math.PI/2;
  cup.position.set(side*.21,.115,0);
  group.add(cup);
  const led=new T.Mesh(new T.TorusGeometry(.073,.011,5,16),neon);
  led.rotation.y=Math.PI/2;
  led.position.set(side*.245,.115,0);
  group.add(led);
 }
 head.add(group);
 return group;
}
