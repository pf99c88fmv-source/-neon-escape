"""Original 140 BPM straight techno. Reproducible synthesis; no third-party samples."""
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt,sawtooth
from scipy.io.wavfile import write
import subprocess,json,hashlib
SR=44100; BPM=140; B=60/BPM; BEATS=192; N=round(BEATS*B*SR)
rng=np.random.default_rng(148032)
drums=np.zeros((N,2),np.float32); music=np.zeros_like(drums); low=np.zeros(N,np.float32)
def filt(x,hz,kind='lowpass',order=2):return sosfilt(butter(order,hz,kind,fs=SR,output='sos'),x)
def add(dst,sound,beat,gain=1,pan=0):
 i=round(beat*B*SR)
 if i>=N:return
 s=np.asarray(sound,dtype=np.float32)*gain; k=min(len(s),N-i)
 if dst.ndim==1:dst[i:i+k]+=s[:k];return
 dst[i:i+k,0]+=s[:k]*(1-pan*.55);dst[i:i+k,1]+=s[:k]*(1+pan*.55)
def clock(n):return np.arange(round(n*SR))/SR
def fade(x,t,attack=.003,decay=10):return x*(1-np.exp(-t/attack))*np.exp(-t*decay)
t=clock(.48);freq=51+145*np.exp(-t*70)+23*np.exp(-t*12)
kick=np.sin(2*np.pi*np.cumsum(freq)/SR)*np.exp(-t*8.5)
kick+=filt(rng.normal(0,1,len(t)),2700,'highpass')*np.exp(-t*390)*.22
kick=np.tanh(kick*2.2)/2.2*1.36
# A subtle low-pass reverberant tail, continuously ducked under the next kick.
rumble=np.zeros(round(SR*1.5))
for delay,gain in [(.17,.38),(.29,.29),(.41,.22),(.61,.14),(.83,.08)]:
 i=round(delay*SR); k=min(len(kick),len(rumble)-i);rumble[i:i+k]+=kick[:k]*gain
rumble=filt(np.tanh(rumble*4),[35,190],'bandpass')
def hat(length,decay):
 t=clock(length);metal=sum(np.sign(np.sin(2*np.pi*f*t)) for f in [417,581,811,1037,1481,1793])/6
 noise=rng.normal(0,1,len(t));s=filt(noise*.6+metal*.4,6500,'highpass');return fade(s,t,.0005,decay)
closed=hat(.1,65);opened=hat(.3,14);ride=hat(.45,8)
t=clock(.23);clap=np.zeros(len(t))
for d in [0,.011,.022,.031]:
 env=np.where(t>=d,np.exp(-np.maximum(0,t-d)*85),0);clap+=rng.normal(0,1,len(t))*env
clap=filt(clap,[1100,8200],'bandpass')*.35
# Metallic rack percussion with a brief stereo echo.
t=clock(.17);metal=fade(sum(np.sin(2*np.pi*f*t)*w for f,w in [(331,1),(587,.6),(991,.4),(1727,.25)]),t,.001,32)
metal=filt(np.tanh(metal*2),700,'highpass')*.23
bass_cache={};acid_cache={}
def bass(note):
 if note in bass_cache:return bass_cache[note]
 t=clock(.18);hz=55*2**(note/12);s=np.sin(2*np.pi*hz*t)+.16*sawtooth(2*np.pi*hz*t)
 s=fade(filt(np.tanh(s*1.8),450),t,.004,19);bass_cache[note]=s;return s
def acid(note,cut):
 key=(note,cut)
 if key in acid_cache:return acid_cache[key]
 t=clock(.24);hz=110*2**(note/12)
 s=sawtooth(2*np.pi*hz*t)*.65+sawtooth(2*np.pi*hz*1.004*t)*.35
 # Parallel resonant band accent retains bite without unbounded feedback.
 s=filt(s,cut)+.45*filt(s,[max(150,cut*.65),min(9000,cut*1.3)],'bandpass')
 s=fade(np.tanh(s*2.4)*.5,t,.002,17);acid_cache[key]=s;return s
def stab(bright):
 t=clock(.9);s=np.zeros(len(t))
 for hz in [220,261.6256,329.6276]:s+=sawtooth(2*np.pi*hz*t)+.4*sawtooth(2*np.pi*hz*1.003*t)
 s=filt(np.tanh(s*.7),bright);return fade(s,t,.006,7)*.25
stabs={800:stab(800),1700:stab(1700),2600:stab(2600)}
for beat in range(BEATS):
 bar=beat//4;drop=8<=bar<20 or 28<=bar<48;brk=20<=bar<24;build=4<=bar<8 or 24<=bar<28
 # Straight four-on-the-floor. Breakdown removes the kick; it never becomes a breakbeat.
 if not brk:
  add(drums,kick,beat,.86 if drop else .73)
  if bar>=2:add(low,rumble,beat,.58 if drop else .31)
 if bar>=1 and not brk:
  add(drums,closed,beat,.035, -.24)
  add(drums,opened,beat+.5,.18 if drop else .11,.26)
  if drop:
   for off in [.25,.75]:add(drums,closed,beat+off,.053 if off==.75 else .035,-.4)
 if (drop or build) and beat%2==1:add(drums,clap,beat,.19 if drop else .13,-.08)
 if bar>=28 and not brk:add(drums,ride,beat+.5,.043,.48)
 if bar>=2 and not brk:
  for j,off in enumerate([.25,.5,.75]):
   note=[0,0,0,0,0,0,3,0][(beat*3+j)%8]
   add(music,bass(note),beat+off,.17 if drop else .10,0)
 if bar>=4:
  cutoff=1700 if drop else (450+(bar%4)*280 if build else 650)
  for j,off in enumerate([.25,.75]):
   idx=(beat*2+j)%16;note=[0,0,12,0,7,0,10,0,0,12,0,3,7,0,12,10][idx]
   if brk and idx%4:continue
   s=acid(note,cutoff);gain=.085 if drop else .045
   add(music,s,beat+off,gain,-.18 if j==0 else .18)
   add(music,s,beat+off+.75,gain*.27,.65 if j==0 else -.65)
   add(music,s,beat+off+1.5,gain*.10,-.5)
 if drop and beat%4 in [1,3]:
  add(drums,metal,beat+.75,.23, -.65 if beat%4==1 else .65)
  add(drums,metal,beat+1.125,.055,.55)
 if bar>=6 and beat%8==0:
  s=stabs[2600 if bar>=28 else 1700 if drop else 800];add(music,s,beat,.30 if drop else .16,-.1)
  add(music,s,beat+.75,.09,.6);add(music,s,beat+1.5,.045,-.6)
# Wide atmosphere, lower in the drops; no melody copied from an existing recording.
t=np.arange(N)/SR
for idx,hz in enumerate([110,164.8138,220,261.6256]):
 pad=np.sin(2*np.pi*hz*t+.7*np.sin(2*np.pi*.12*t+idx))*.009
 pad+=np.sin(2*np.pi*hz*1.002*t)*.006
 envelope=np.where((t/B>=80)&(t/B<112),1.8,.45)
 music[:,0]+=pad*envelope;music[:,1]+=np.roll(pad,round(.011*SR))*envelope
# Builds: noise swells, high-pass industrial lift and snare roll on the final two bars.
for start,end in [(16,32),(96,112)]:
 length=(end-start)*B;tt=clock(length);progress=tt/length
 noise=filt(rng.normal(0,1,len(tt)),[1600,9500],'bandpass')
 riser=noise*progress**2*.05*(.65+.35*np.sin(2*np.pi*8*tt)**2)
 add(music,riser,start,1,-.2)
 for b in np.arange(end-4,end,.25):add(drums,clap,b,.025+.09*(b-(end-4))/4,(b%1-.5)*.8)
# Controlled impact and metallic wash at each drop.
for b in [32,112]:
 tt=clock(2.4);wash=filt(rng.normal(0,1,len(tt)),[2400,10000],'bandpass')*np.exp(-tt*2.5)*.045
 add(drums,wash,b,1,-.25);add(drums,wash,b+.12,.6,.65)
phase=(np.arange(N)/SR/B)%1
sidechain=.18+.82*(1-np.exp(-phase*8))
music*=sidechain[:,None];low*=sidechain
mix=drums+music+low[:,None]*.29
mix=filt(mix.T,28,'highpass').T # avoid inaudible subsonics
mix=np.tanh(mix*1.38)/1.38
fadeout=np.clip((BEATS*B-np.arange(N)/SR)/1.3,0,1);mix*=fadeout[:,None]
peak=float(np.max(np.abs(mix)));mix*=.86/max(peak,.01)
root=Path(__file__).resolve().parents[1];out=root/'assets/audio';out.mkdir(parents=True,exist_ok=True)
wav=out/'techno-rush-3d-source.wav';mp3=out/'techno-rush-3d.mp3'
write(wav,SR,(mix*32767).astype(np.int16))
subprocess.run(['ffmpeg','-y','-v','error','-i',str(wav),'-af','loudnorm=I=-12:TP=-1.5:LRA=7','-ar','44100','-codec:a','libmp3lame','-b:a','160k',str(mp3)],check=True)
meta={'title':'МАКАР + ЖЕНЯ — Tunnel Pressure','bpm':BPM,'beats':BEATS,'duration':BEATS*B,'sha256':hashlib.sha256(mp3.read_bytes()).hexdigest(),'sampleRate':SR,'originalSynthesis':True}
(out/'track.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
print(json.dumps(meta,ensure_ascii=False));print('MP3 bytes',mp3.stat().st_size)
