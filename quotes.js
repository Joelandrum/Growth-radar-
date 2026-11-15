// Netlify serverless quote proxy. Configure FINNHUB_API_KEY in Netlify environment.
// Quotes may be delayed. Respect provider terms and free-tier limits.
const CRYPTO={BTC:'bitcoin',ETH:'ethereum',XRP:'ripple'};
const json=(code,obj)=>({statusCode:code,headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*'},body:JSON.stringify(obj)});
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return json(405,{error:'GET only'});
 const raw=event.queryStringParameters?.symbols||'';
 const symbols=[...new Set(raw.split(',').map(s=>s.trim().toUpperCase()).filter(s=>/^[A-Z0-9.\-]{1,12}$/.test(s)))].slice(0,30);
 if(!symbols.length)return json(400,{error:'Provide symbols'});
 const quotes={},missing=[];const now=new Date().toISOString();
 const crypto=symbols.filter(s=>CRYPTO[s]);
 if(crypto.length){try{
  const ids=crypto.map(s=>CRYPTO[s]).join(',');const resp=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+encodeURIComponent(ids)+'&vs_currencies=usd',{signal:AbortSignal.timeout(9000)});
  if(!resp.ok)throw Error('Crypto provider '+resp.status);
  const prices=await resp.json();for(const s of crypto){const p=prices[CRYPTO[s]]?.usd;if(Number.isFinite(p)&&p>0)quotes[s]={price:p,timestamp:now,source:'CoinGecko (retrieved)'};else missing.push(s)}
 }catch{missing.push(...crypto)}}
 const stocks=symbols.filter(s=>!CRYPTO[s]);const key=process.env.FINNHUB_API_KEY;
 if(stocks.length&&!key)missing.push(...stocks);
 if(key){await Promise.all(stocks.map(async s=>{try{
  const resp=await fetch('https://finnhub.io/api/v1/quote?symbol='+encodeURIComponent(s)+'&token='+encodeURIComponent(key),{signal:AbortSignal.timeout(9000)});
  if(!resp.ok)throw Error('Quote unavailable');const q=await resp.json();
  if(Number.isFinite(q.c)&&q.c>0){quotes[s]={price:q.c,timestamp:q.t?new Date(q.t*1000).toISOString():now,source:'Finnhub'};}else missing.push(s)
 }catch{missing.push(s)}}))}
 return json(200,{quotes,missing:[...new Set(missing)],retrievedAt:now,disclaimer:'Indicative quotes; some may be delayed or stale. Verify before trading.'});
};
