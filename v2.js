// Growth Radar v2: optional same-origin serverless quotes; never stores API credentials.
const v2Key='growth-radar-v2-settings';
let quoteConfig={endpoint:'/.netlify/functions/quotes',auto:false,alerts:true};
try{quoteConfig={...quoteConfig,...JSON.parse(localStorage.getItem(v2Key)||'{}')}}catch{}
let quoteTimer=null, lastQuoteStatus='Historical snapshot — no successful refresh';
function initV2(){
 $('quoteEndpoint').value=quoteConfig.endpoint;
 $('autoRefresh').checked=quoteConfig.auto;
 $('alertsEnabled').checked=quoteConfig.alerts;
 $('quoteStatus').textContent=lastQuoteStatus;
 $('providerMessage').textContent='Configured endpoint: '+quoteConfig.endpoint+' (requires deployment)';
 scheduleQuoteRefresh();renderAlerts();
}
function saveQuoteSettings(){
 const ep=$('quoteEndpoint').value.trim();
 if(!ep.startsWith('/')||ep.startsWith('//')||ep.includes('\\')){alert('Use a same-origin endpoint path starting with /, such as /.netlify/functions/quotes');return}
 quoteConfig={endpoint:ep,auto:$('autoRefresh').checked,alerts:$('alertsEnabled').checked};
 localStorage.setItem(v2Key,JSON.stringify(quoteConfig));
 $('providerMessage').textContent='Settings saved. Quotes require a deployed and configured backend.';
 scheduleQuoteRefresh();renderAlerts();
}
function scheduleQuoteRefresh(){
 if(quoteTimer)clearInterval(quoteTimer);
 if(quoteConfig.auto)quoteTimer=setInterval(()=>{if(!document.hidden&&navigator.onLine)refreshQuotes()},300000);
}
function renderAlerts(){
 const t=totals(),notes=[];
 if(t.total>0&&t.crypto/t.total>.25)notes.push('Crypto concentration '+pct(t.crypto/t.total)+' exceeds 25% review threshold');
 for(const w of data.watch){const [_,flag]=signal(w);if(flag==='buy')notes.push(w.symbol+' entered provisional research zone (verify quote and thesis)')}
 $('alertSummary').textContent=quoteConfig.alerts?('In-app watch: '+(notes.length?notes.slice(0,3).join(' • '):'No qualifying watch conditions')):'In-app alerts disabled';
}
const v1Render=render;render=function(){v1Render();renderAlerts()};
async function refreshQuotes(){
 const btn=$('refreshQuotes');btn.disabled=true;
 $('quoteStatus').textContent='Refreshing quotes…';
 try{
  const symbols=[...new Set([...data.holdings.filter(h=>h.type!=='cash').map(h=>h.symbol),...data.watch.map(w=>w.symbol)])];
  const u=new URL(quoteConfig.endpoint,location.origin);u.searchParams.set('symbols',symbols.join(','));
  const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(),18000);
  let res;try{res=await fetch(u,{cache:'no-store',signal:ctl.signal})}finally{clearTimeout(timeout)}
  if(!res.ok)throw Error('Provider HTTP '+res.status);
  const payload=await res.json();if(!payload||typeof payload.quotes!=='object')throw Error('Unexpected provider response');
  let updated=0;const stamp=new Date().toISOString();
  for(const h of data.holdings){const q=payload.quotes[h.symbol];if(h.type!=='cash'&&q&&Number.isFinite(q.price)&&q.price>0){h.price=q.price;h.quoteTime=q.timestamp||stamp;h.quoteSource=q.source||'provider';updated++}}
  for(const w of data.watch){const q=payload.quotes[w.symbol];if(q&&Number.isFinite(q.price)&&q.price>0){w.price=q.price;w.date=(q.timestamp||stamp).slice(0,10);w.quoteTime=q.timestamp||stamp;w.quoteSource=q.source||'provider';updated++}}
  if(!updated)throw Error('No valid prices returned');
  persist();
  const missing=Array.isArray(payload.missing)?payload.missing.length:0;
  lastQuoteStatus=`Updated ${updated} records · ${new Date().toLocaleString()}${missing?' · '+missing+' symbols unavailable':''}`;
  $('quoteStatus').textContent=lastQuoteStatus;
  $('providerMessage').textContent='Provider refreshed. Data may be delayed; confirm market timestamps before trading.';
 }catch(err){lastQuoteStatus='Refresh failed — existing prices retained';$('quoteStatus').textContent=lastQuoteStatus;$('providerMessage').textContent='Quote error: '+err.message+'; manual prices remain available.'}
 finally{btn.disabled=false}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&quoteConfig.auto&&navigator.onLine)refreshQuotes()});
initV2();
