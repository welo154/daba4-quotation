(function(){
  const cfg=window.WAHAJ_SUPABASE||{};
  function configured(){return !!(cfg.url&&cfg.key&&String(cfg.url).includes('supabase.co'));}
  async function api(path,options={}){
    if(!configured())throw Error('Supabase is not configured yet. Add the project URL and anon key to config.js.');
    const r=await fetch(String(cfg.url).replace(/\/$/,'')+path,{
      ...options,
      headers:{apikey:cfg.key,Authorization:'Bearer '+cfg.key,'Content-Type':'application/json',...options.headers}
    });
    const t=await r.text();
    let d=null;
    try{d=t?JSON.parse(t):null;}catch(_){d={message:t};}
    if(!r.ok)throw Error(d?.message||d?.msg||d?.error_description||d?.hint||('Request failed ('+r.status+')'));
    return d;
  }
  async function ping(){
    if(!configured())return {ok:false,message:'Not configured'};
    try{
      await api('/rest/v1/invoices?select=id&limit=1');
      return {ok:true,message:'Connected'};
    }catch(e){
      return {ok:false,message:e.message||'Connection failed'};
    }
  }
  window.WahajDB={configured,api,ping,config:cfg};
})();
