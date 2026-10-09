import {LANES} from './course.js';
export class Input{
 constructor(canvas,onMove,onPause){this.mode='lanes';this.enabled=false;this.target=0;this.pointer=null;
 canvas.addEventListener('pointerdown',e=>{if(!this.enabled||this.pointer!==null)return;this.pointer=e.pointerId;this.origin=e.clientX;this.base=this.target;canvas.setPointerCapture(e.pointerId);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==this.pointer||!this.enabled)return;const delta=(e.clientX-this.origin)/Math.min(innerWidth*.14,60);this.target=this.mode==='lanes'?LANES[Math.max(0,Math.min(2,Math.round(this.base/2.4+delta)+1))]:Math.max(-2.7,Math.min(2.7,this.base+delta*2.4));onMove(this.target);e.preventDefault();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===this.pointer)this.pointer=null;});
 addEventListener('keydown',e=>{if(e.code==='Escape'){onPause();return;}if(!this.enabled)return;if(['ArrowLeft','KeyA','ArrowRight','KeyD'].includes(e.code)){e.preventDefault();this.target=Math.max(-2.4,Math.min(2.4,this.target+(['ArrowLeft','KeyA'].includes(e.code)?-2.4:2.4)));onMove(this.target);}});
 }
 reset(){this.target=0;this.pointer=null;}
}
