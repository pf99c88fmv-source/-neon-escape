const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
  try {
    for (const telegram of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('https://telegram.org/js/telegram-web-app.js', route => route.fulfill({ contentType: 'application/javascript', body: telegram ? `window.events={};window.calls=[];window.Telegram={WebApp:{viewportStableHeight:700,safeAreaInset:{top:24},contentSafeAreaInset:{top:48},ready(){calls.push('ready')},expand(){calls.push('expand')},isVersionAtLeast(){return true},disableVerticalSwipes(){calls.push('swipes')},onEvent(name,fn){events[name]=fn}}};` : '' }));
      await page.route('https://neon.test/', route => route.fulfill({ contentType: 'text/html', body: html }));
      // Storage can be unavailable in a WebView; this must not prevent playing.
      await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
      await page.goto('https://neon.test/');
      await page.click('#start');
      await page.evaluate(() => { cancelAnimationFrame(raf); last=0; loop(10000); cancelAnimationFrame(raf); });
      assert.equal(await page.evaluate(() => score), 0, 'first frame must not award time');
      await page.touchscreen.tap(70, 600);
      assert.equal(await page.evaluate(() => player.target), 70);
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.evaluate(() => player.target), 135);
      await page.setViewportSize({ width: 300, height: 500 });
      await page.evaluate(() => { player.target=1000; resize(); });
      assert.equal(await page.evaluate(() => player.target), 278);
      assert.equal(await page.evaluate(() => player.y), (telegram ? 700 : 500) * .82);
      await page.evaluate(() => { objects=[{x:player.x,y:player.y,r:12,type:'gem',speed:0}];loop(10000);cancelAnimationFrame(raf); });
      assert.equal(await page.evaluate(() => Math.floor(score)), 50);
      for(let i=0;i<3;i++) await page.evaluate(() => { invuln=0;objects=[{x:player.x,y:player.y,r:20,type:'block',speed:0}];loop(10000);cancelAnimationFrame(raf); });
      assert.equal(await page.evaluate(() => lives), 0);
      assert.equal(await page.locator('#overlay').isVisible(), true);
      assert.equal(await page.evaluate(() => best), 50);
      await page.click('#start');
      await page.evaluate(() => { cancelAnimationFrame(raf); });
      assert.equal(await page.evaluate(() => lives), 3);
      await page.evaluate(() => { setPaused(true);loop(20000); });
      assert.equal(await page.evaluate(() => score), 0);
      await page.evaluate(() => { setPaused(false);cancelAnimationFrame(raf); });
      if(telegram) {
        assert.deepEqual(await page.evaluate(() => calls), ['ready','expand','swipes']);
        assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--safe-top')), '48px');
        await page.evaluate(() => { events.deactivated(); });
        assert.equal(await page.evaluate(() => paused), true);
        await page.evaluate(() => { events.activated();cancelAnimationFrame(raf); });
        assert.equal(await page.evaluate(() => paused), false);
      }
      await page.evaluate(() => { end();Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}}); });
      await page.click('#share');
      assert.equal(await page.locator('#share').textContent(), 'НЕ УДАЛОСЬ ПОДЕЛИТЬСЯ');
      assert.deepEqual(errors, []);
      console.log(`PASS: ${telegram ? 'Telegram API mock' : 'browser'}, touch, keyboard, resize, scoring, lives, replay, pause, blocked storage/share`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
