"""Prune unused animation buffers and resize embedded textures; preserves rig/weights."""
import json,struct,io,pathlib
from PIL import Image
p=pathlib.Path(__file__).resolve().parents[1]/'assets/models/raver.glb'
b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);raw=b[28+n:]
keep={'Jog_Fwd_Loop','Sprint_Loop','Dance_Loop','Idle_Loop','Hit_Chest','Death01','Jump_Land'}
j['animations']=[a for a in j['animations'] if a['name'] in keep]
used=set()
for m in j['meshes']:
 for x in m['primitives']:used.update(x['attributes'].values());used.add(x['indices'])
for s in j['skins']:used.add(s['inverseBindMatrices'])
for a in j['animations']:
 for s in a['samplers']:used.update([s['input'],s['output']])
ids={a:i for i,a in enumerate(sorted(used))};j['accessors']=[j['accessors'][a] for a in sorted(used)]
for m in j['meshes']:
 for x in m['primitives']:x['attributes']={k:ids[v] for k,v in x['attributes'].items()};x['indices']=ids[x['indices']]
for s in j['skins']:s['inverseBindMatrices']=ids[s['inverseBindMatrices']]
for a in j['animations']:
 for s in a['samplers']:s['input']=ids[s['input']];s['output']=ids[s['output']]
new=[];data=bytearray()
def append(part,target=None):
 while len(data)%4:data.append(0)
 v={'buffer':0,'byteOffset':len(data),'byteLength':len(part)}
 if target:v['target']=target
 idx=len(new);new.append(v);data.extend(part);return idx
sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};counts={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
for a in j['accessors']:
 v=j['bufferViews'][a['bufferView']];size=sizes[a['componentType']]*counts[a['type']];start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size)
 part=b''.join(raw[start+k*stride:start+k*stride+size] for k in range(a['count']))
 a['bufferView']=append(part,v.get('target'));a.pop('byteOffset',None)
for image in j['images']:
 v=j['bufferViews'][image['bufferView']];start=v.get('byteOffset',0);part=raw[start:start+v['byteLength']]
 im=Image.open(io.BytesIO(part));im.thumbnail((512,512));out=io.BytesIO();im.save(out,format='PNG',optimize=True)
 image['bufferView']=append(out.getvalue());image['mimeType']='image/png'
j['bufferViews']=new;j['buffers']=[{'byteLength':len(data)}]
while len(data)%4:data.append(0)
s=json.dumps(j,separators=(',',':')).encode();s+=b' '*((-len(s))%4)
p.write_bytes(struct.pack('<III',0x46546c67,2,28+len(s)+len(data))+struct.pack('<II',len(s),0x4e4f534a)+s+struct.pack('<II',len(data),0x004e4942)+data)
print('Optimized',p.stat().st_size,'bytes; clips',len(j['animations']))
