const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const URL=process.env.GAME_URL||'https://pf99c88fmv-source.github.io/-neon-escape/cosmic-rave-v2/index.html';
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>fs.existsSync(p));
async function testCase(browser,telegram){
 const context=await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:2,
  isMobile:true,hasTouch:true,locale:'ru-RU'
 });
 const page=await context.newPage();
 const runtime=[],failed=[];
 page.on('pageerror',e=>runtime.push(e.message));
 page.on('requestfailed',req=>{
  if(!req.url().includes('telegram.org'))failed.push(req.url()+': '+req.failure()?.errorText);
 });
 await page.route('https://telegram.org/js/telegram-web-app.js',route=>{
  if(!telegram)return route.abort('failed');
  return route.fulfill({contentType:'application/javascript',body:`
    window.Telegram={WebApp:{
      ready(){},expand(){},setHeaderColor(){},setBackgroundColor(){},
      disableVerticalSwipes(){},onEvent(){},
      HapticFeedback:{impactOccurred(){}},
      BackButton:{onClick(){}}
    }};
  `});
 });
 try{
  const response=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});
  assert.equal(response.status(),200,'game HTML must return HTTP 200');
  await page.waitForFunction(()=>{
   const play=document.getElementById('play');
   return play&&!play.disabled&&play.textContent.includes('ИГРАТЬ');
  },null,{timeout:45000});
  assert.equal(await page.locator('#fatal').isVisible(),false,'no fatal screen during startup');
  assert.ok(await page.evaluate(()=>document.querySelector('#scene')?.getContext('webgl2')||
    document.querySelector('#scene')?.getContext('webgl')),'WebGL canvas must exist');
  await page.locator('#play').click();
  await page.waitForFunction(()=>!document.getElementById('hud')?.hidden,null,{timeout:25000});
  assert.equal(await page.locator('#fatal').isVisible(),false,'no fatal screen when game begins');
  assert.equal(runtime.length,0,'no uncaught JavaScript exceptions: '+runtime.join(' | '));
  assert.equal(failed.length,0,'all same-origin game assets must load: '+failed.join(' | '));
  console.log('PASS',telegram?'mock Telegram SDK':'blocked Telegram SDK',URL);
 }catch(error){
  const details=await page.evaluate(()=>({
   fatal:document.getElementById('fatal')?.innerText,
   fatalVisible:!document.getElementById('fatal')?.hidden,
   load:document.getElementById('load')?.innerText,
   playDisabled:document.getElementById('play')?.disabled,
   state:document.readyState
  })).catch(()=>({}));
  console.error('FAIL',telegram?'Telegram SDK':'SDK blocked',{details,runtime,failed,error:String(error)});
  throw error;
 }finally{await context.close();}
}
(async()=>{
 const browser=await chromium.launch({
  ...(chrome?{executablePath:chrome}:{}),
  headless:true,
  args:['--no-sandbox','--disable-gpu-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']
 });
 try{
  await testCase(browser,false);
  await testCase(browser,true);
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
