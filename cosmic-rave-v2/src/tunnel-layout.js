// Pure tunnel-layout calculations, deliberately independent of WebGL for regression tests.
export const FRAME_COUNT=20;
export const FRAME_STEP=11.5;
export const FRAME_SPAN=FRAME_COUNT*FRAME_STEP;
export const NEAR_Z=12;
export const ROAD_HALF_WIDTH=4.8;
// Left to right: a faceted, cavernous roof. The player corridor remains open.
export const ARCH_PROFILE=[
 [-6.15,.25],[-6.12,2.7],[-5.52,5.15],[-4.25,7.05],
 [-2.55,8.38],[0,8.92],[2.55,8.38],[4.25,7.05],
 [5.52,5.15],[6.12,2.7],[6.15,.25]
];
export function wrap(value,span){return ((value%span)+span)%span;}
export function frameZ(index,travel){
 return NEAR_Z-wrap(index*FRAME_STEP-travel,FRAME_SPAN);
}
// Used by the test suite and by the runner to assert playable clearance.
export function archSideClearance(y){
 if(y<=ARCH_PROFILE[1][1])return Math.abs(ARCH_PROFILE[0][0]);
 for(let i=1;i<=4;i++){
  const [xa,ya]=ARCH_PROFILE[i], [xb,yb]=ARCH_PROFILE[i+1];
  if(y>=ya&&y<=yb)return Math.abs(xa+(xb-xa)*(y-ya)/(yb-ya));
 }
 return 0;
}
