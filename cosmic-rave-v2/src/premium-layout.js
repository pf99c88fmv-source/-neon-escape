import {frameZ,ROAD_HALF_WIDTH} from './tunnel-layout.js';
export const DISPLAY_RADIUS=1.6;
export const PROP_X=6.85;
export const DANCER_X=6.75;
export const PROP_SLOTS=Object.freeze([
 {side:-1,slot:2,kind:'bottle'},
 {side:1,slot:8,kind:'cash'},
 {side:1,slot:12,kind:'bottle'},
 {side:-1,slot:17,kind:'cash'}
]);
export const DANCER_SLOTS=Object.freeze([
 {side:-1,slot:5},
 {side:1,slot:14}
]);
export const SIDE_CLEARANCE= Math.min(PROP_X,DANCER_X)-DISPLAY_RADIUS-ROAD_HALF_WIDTH;
export function displayZ(slot,travel,offset=5.5){
 return frameZ(slot,travel)-offset;
}
