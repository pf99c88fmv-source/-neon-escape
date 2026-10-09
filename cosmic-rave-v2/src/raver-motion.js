// Deterministic, framerate-independent rhythmic cues for a running rave performer.
// These values are modest additive rotations on an existing skeletal rig.
// The actual running leg animation remains untouched.
export function pulse(beat){
 const phase=2*Math.PI*beat;
 return .5+.5*Math.cos(phase);
}
export function danceIntensity(beat,active,combo=0,hit=false){
 if(!active||hit)return 0;
 const basic=.45;
 const successful=Math.min(.23,Math.max(0,combo)*.012);
 // A two-beat stage flourish at the start of each 16-beat phrase.
 const phrase=((beat%16)+16)%16;
 const flourish=phrase<2?.28*Math.sin(phrase*Math.PI/2)**2:0;
 return Math.min(.98,basic+successful+flourish);
}
export function groovePose(beat,active,combo=0,hit=false){
 const amount=danceIntensity(beat,active,combo,hit);
 const q=beat*2*Math.PI;
 const slow=q*.5;
 return {
  intensity:amount,
  headX:Math.sin(q)*.085*amount,
  headZ:Math.sin(slow+.6)*.08*amount,
  spineX:Math.cos(q)*.045*amount,
  spineY:Math.sin(slow)*.11*amount,
  spineZ:Math.sin(slow-.5)*.095*amount,
  leftArmZ:Math.sin(q+.9)*.11*amount,
  rightArmZ:-Math.sin(q+.9)*.11*amount,
  leftShoulderX:Math.sin(q+.3)*.095*amount,
  rightShoulderX:-Math.sin(q+.3)*.095*amount,
  bodyYaw:Math.sin(slow)*.04*amount,
  bodyLean:Math.sin(slow-.5)*.045*amount,
  bob:active?Math.max(0,Math.sin(q))*.017*amount:0
 };
}
export function selectRunAnimation(beat,active,hit=false,until=-1,result=null,breakpoint=543){
 if(result)return result;
 if(hit||beat<until)return 'Hit_Chest';
 if(!active)return 'Dance_Loop';
 return beat>=breakpoint?'Sprint_Loop':'Jog_Fwd_Loop';
}
