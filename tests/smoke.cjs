// Run with: npm run test:browser (requires Playwright and Chromium).
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const https=require('node:https');
const root=path.resolve(__dirname,'..');
const prefix='/neon-escape/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg'};
const handler=(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
  const file=path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)||'index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'Missing':data)});
};
const tls=process.env.TEST_SSL_CERT&&process.env.TEST_SSL_KEY;
const server=tls?https.createServer({cert:fs.readFileSync(process.env.TEST_SSL_CERT),key:fs.readFileSync(process.env.TEST_SSL_KEY)},handler):http.createServer(handler);
const telegramScript=`window.tgEvents={};window.tgCalls=[];window.Telegram={WebApp:{viewportStableHeight:780,safeAreaInset:{top:24,bottom:20},contentSafeAreaInset:{top:44},ready(){tgCalls.push('ready')},expand(){tgCalls.push('expand')},isVersionAtLeast(){return true},disableVerticalSwipes(){tgCalls.push('swipes')},onEvent(n,f){tgEvents[n]=f},shareMessage(){throw Error('text cannot be a prepared message ID')},BackButton:{hide(){},onClick(f){window.tgBack=f}},HapticFeedback:{notificationOccurred(){}},setHeaderColor(){},setBackgroundColor(){}}};`;
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`${tls?'https':'http'}://127.0.0.1:${server.address().port}${prefix}`;
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox'],headless:true});
  try{
    for(const telegram of [false,true]){
      const page=await browser.newPage({viewport:{width:320,height:900},hasTouch:true,ignoreHTTPSErrors:true});
      const errors=[],badResponses=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)badResponses.push(r.url())});
      await page.route('https://telegram.org/**',r=>telegram?r.fulfill({contentType:'application/javascript',body:telegramScript}):r.abort());
      await page.goto(base);await page.waitForFunction(()=>window.__MAKAR_GAME__);
      assert.equal(await page.title(),'МАКАР + ЖЕНЯ');
      assert.match(await page.locator('h1').textContent(),/МАКАР\s*\+\s*ЖЕНЯ/);
      assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.audio),null,'audio must await a user gesture');
      assert.equal(await page.locator('.brand-mark').evaluate(el=>{const b=el.getBoundingClientRect();return [...el.childNodes].every(n=>{const r=document.createRange();r.selectNodeContents(n);const t=r.getBoundingClientRect();return t.top>=b.top&&t.bottom<=b.bottom&&t.left>=b.left&&t.right<=b.right})}),true,'all logo letters must fit in their frame');
      await page.click('#how-button');await page.click('#help-close');
      await page.click('#settings-button');await page.check('#reduced-motion');
      assert.equal(await page.locator('#app').evaluate(e=>e.classList.contains('reduced-effects')),true);
      await page.locator('#offset').evaluate(e=>{e.value='150';e.dispatchEvent(new Event('input',{bubbles:true}))});
      await page.click('#settings-close');
      await page.click('#play-button');await page.waitForFunction(()=>['countdown','playing'].includes(__MAKAR_GAME__.state.screen));
      assert.equal(await page.locator('#loading-screen h2').textContent(),'МАКАР + ЖЕНЯ');
      await page.waitForFunction(()=>__MAKAR_GAME__.state.screen==='playing');
      const audio=await page.evaluate(()=>{const s=__MAKAR_GAME__.state;return{state:s.audio.state,duration:s.buffer.duration,channels:s.buffer.numberOfChannels,hasSignal:s.buffer.getChannelData(0).some(v=>Math.abs(v)>.01)}});
      assert.equal(audio.state,'running');assert.equal(audio.channels,2);assert.ok(audio.hasSignal);assert.ok(audio.duration>54&&audio.duration<56);
      const client=await page.context().newCDPSession(page);
      const target=await page.evaluate(()=>__MAKAR_GAME__.state.run.targetX);
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:160,y:500}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:210,y:500}]});
      assert.ok(await page.evaluate(()=>__MAKAR_GAME__.state.run.targetX)>target);
      await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
      assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.pointerId),null);
      await page.waitForFunction(()=>__MAKAR_GAME__.state.run.beat>2);
      await page.keyboard.down('ArrowLeft');await page.click('#pause-button');await page.keyboard.up('ArrowLeft');
      const paused=await page.evaluate(()=>__MAKAR_GAME__.state.run.beat);
      assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.source),null);
      await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.run.beat),paused);
      await page.click('#resume-button');await page.waitForFunction(()=>__MAKAR_GAME__.state.screen==='playing');
      await page.waitForFunction(b=>__MAKAR_GAME__.state.run.beat>b,paused);
      if(telegram){
        assert.deepEqual(await page.evaluate(()=>tgCalls),['ready','expand','swipes']);
        assert.equal(await page.locator('#app').evaluate(e=>e.style.getPropertyValue('--safe-t')),'44px');
        await page.evaluate(()=>{Telegram.WebApp.safeAreaInset={};Telegram.WebApp.contentSafeAreaInset={};tgEvents.safeAreaChanged()});
        assert.equal(await page.locator('#app').evaluate(e=>e.style.getPropertyValue('--safe-t')),'');
        await page.evaluate(()=>tgEvents.deactivated());assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.screen),'pause');
        await page.evaluate(()=>tgEvents.activated());assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.screen),'pause');
        await page.click('#resume-button');await page.waitForFunction(()=>__MAKAR_GAME__.state.screen==='playing');
        await page.evaluate(()=>{Telegram.WebApp.viewportStableHeight=390;tgEvents.viewportChanged()});
      }
      await page.setViewportSize({width:844,height:390});
      await page.waitForFunction(()=>__MAKAR_GAME__.state.width===844);
      await page.waitForTimeout(50);
      const layout=await page.evaluate(()=>{const s=__MAKAR_GAME__.state,m=document.querySelector('canvas').getContext('2d').getTransform();return{ship:s.playerY*m.d,height:document.querySelector('canvas').height,app:document.querySelector('#app').clientHeight}});
      assert.ok(layout.ship<layout.height);assert.equal(layout.app,390);
      await page.evaluate(()=>__MAKAR_GAME__.state.audio.suspend());
      await page.waitForFunction(()=>__MAKAR_GAME__.state.screen==='pause');
      await page.click('#resume-button');await page.waitForFunction(()=>__MAKAR_GAME__.state.screen==='playing');
      // A real losing route: hold the ship at the left boundary until collisions exhaust lives.
      await page.evaluate(()=>{const s=__MAKAR_GAME__.state;s.run.x=16;s.run.targetX=16});
      await page.waitForFunction(()=>__MAKAR_GAME__.state.screen==='result',null,{timeout:30000});
      assert.equal(await page.locator('#result-title').textContent(),'МАКАР + ЖЕНЯ');
      assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.run.lives),0);
      await page.locator('#result-menu-button').scrollIntoViewIfNeeded();
      const bounds=await page.locator('#result-menu-button').boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<=390);
      await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}})});
      await page.click('#share-button');assert.equal(await page.locator('#toast').textContent(),'НЕ УДАЛОСЬ ПОДЕЛИТЬСЯ');
      await page.click('#result-menu-button');assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.screen),'menu');
      assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);
      console.log(`PASS: ${telegram?'Telegram mock':'SDK unavailable'}, real MP3, gesture, touchCancel, pause/resume, rotation, defeat/results, ${tls?'HTTPS':'HTTP'} subdirectory`);
      await page.close();
    }
    const page=await browser.newPage({ignoreHTTPSErrors:true,reducedMotion:'reduce'});
    await page.route('https://telegram.org/**',r=>r.abort());
    await page.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined});
    await page.goto(base);await page.waitForFunction(()=>window.__MAKAR_GAME__);
    assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.settings.reduced),true);
    await page.click('#play-button');assert.equal(await page.evaluate(()=>__MAKAR_GAME__.state.screen),'menu');assert.match(await page.locator('#toast').textContent(),/Web Audio API/);
    await page.close();console.log('PASS: no Web Audio API and system reduced motion');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
