import test from 'node:test';
import assert from 'node:assert/strict';
import {styleRaverMaterial,findRigBone} from '../src/raver-fashion.js';
test('festival techwear patches shader while preserving original material',()=>{
 const original={
  isMeshStandardMaterial:true,name:'MI_Superhero_Male',
  roughness:.9,metalness:0,
  clone(){return {...this};}
 };
 class Color{constructor(value){this.value=value;}}
 const styled=styleRaverMaterial(original,{Color});
 assert.notStrictEqual(styled,original);
 assert.equal(original.roughness,.9);
 assert.equal(styled.roughness,.61);
 assert.equal(styled.metalness,.11);
 assert.equal(styled.needsUpdate,true);
 const shader={
  vertexShader:'#include <common>\n#include <begin_vertex>',
  fragmentShader:'#include <common>\n#include <map_fragment>'
 };
 styled.onBeforeCompile(shader);
 assert.match(shader.vertexShader,/vRavePosition=position/);
 assert.match(shader.fragmentShader,/charcoal techwear/);
 assert.match(shader.fragmentShader,/totalEmissiveRadiance/);
 assert.match(shader.fragmentShader,/shoes/);
});
test('materials not part of skinned body are untouched',()=>{
 const material={name:'Hair_Material',isMeshStandardMaterial:false};
 assert.strictEqual(styleRaverMaterial(material,{}),material);
});
test('findRigBone works with normal and Mixamo-style bone names',()=>{
 const bones=[{name:'mixamorig:LeftShoulder'},{name:'Spine1'},{name:'Head'}];
 assert.equal(findRigBone(bones,['head']),bones[2]);
 assert.equal(findRigBone(bones,['spine2','spine1']),bones[1]);
 assert.equal(findRigBone(bones,['leftshoulder']),bones[0]);
 assert.equal(findRigBone(bones,['leftfoot']),null);
});
