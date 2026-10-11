// Same-origin bootstrap. A failed external dependency must never masquerade
// as the unhelpful browser message "Script error.".
const fatal=document.getElementById('fatal');
const details=fatal?.querySelector('p');
const loadStatus=document.getElementById('load');
let moduleLoaded=false;
let displayedFailure=false;
function formatError(error){
 const raw=String(error?.message||error||'Неизвестная ошибка');
 if(/WebGL|GL context|WebGLRenderer|context creation/i.test(raw))
  return 'Устройство не смогло включить 3D-графику (WebGL). Попробуй обновить Telegram или открыть игру в Safari / Chrome.';
 if(/Failed to fetch dynamically imported module|Importing a module script failed|Load failed|ERR_BLOCKED|Failed to resolve module specifier|CORS|network.*module|module.*network|fetch.*module/i.test(raw))
  return 'Не удалось загрузить игровые модули. Проверь соединение с GitHub Pages, отключи блокировщик трафика и нажми «Повторить».';
 if(/not supported|unsupported|unexpected token|syntaxerror/i.test(raw))
  return 'Этот браузер не поддерживает одну из функций 3D-игры. Обнови Telegram или открой игру в Safari / Chrome. ('+raw.slice(0,150)+')';
 return raw.slice(0,240);
}
function showError(error,code='GAME'){
 if(displayedFailure)return;
 displayedFailure=true;
 const msg=formatError(error);
 const text=code+': '+msg;
 if(fatal){fatal.hidden=false;if(details)details.textContent=text;}
 if(loadStatus)loadStatus.textContent=text;
 console.error('Cosmic Rave '+code,error);
}
window.addEventListener('error',event=>{
 // Third-party Telegram SDK is optional: if the host blocks it,
 // the standalone 3D game still has to work.
 const resource=event.target;
 const src=resource?.src||resource?.href||'';
 if(src.includes('telegram-web-app.js')){console.warn('Telegram SDK unavailable; using browser mode');return;}
 if(resource!==window&&src){
  showError(new Error('Не загружен ресурс: '+src.split('/').slice(-2).join('/')),'ASSET');
  return;
 }
 const message=event.message||'';
 if((!message||message==='Script error.')&&!event.filename){
  // Opaque third-party script exception; wait for our controlled module
  // import result rather than showing an unrelated cross-origin failure.
  console.warn('External script failed without CORS details');
  return;
 }
 showError(new Error(message+' '+(event.filename||'')+':'+(event.lineno||0)),'RUNTIME');
},true);
window.addEventListener('unhandledrejection',event=>{
 showError(event.reason||new Error('Асинхронная ошибка'),'ASYNC');
});
const timeout=setTimeout(()=>{
 if(!moduleLoaded)showError(new Error('Загрузка модулей длится более 20 секунд. Проверь подключение и повтори.'),'TIMEOUT');
},20000);
import('./app.js?v=mobile-reliability-1').then(()=>{
 moduleLoaded=true;clearTimeout(timeout);
}).catch(error=>{
 clearTimeout(timeout);
 showError(error,'MODULE');
});
