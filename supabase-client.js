(function(){
  const cfg=window.WAHAJ_SUPABASE||{};
  const STORE='wahaj-studio-v1';
  const uid=()=>crypto.randomUUID?crypto.randomUUID():'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);

  function cloudReady(){return !!(cfg.url&&cfg.key&&String(cfg.url).includes('supabase.co'));}

  function emptyLocal(){return {invoiceNext:1,quotationNext:1,invoices:[],invoiceHistory:[],quotations:[],quotationHistory:[]};}
  function saveLocal(data){localStorage.setItem(STORE,JSON.stringify(data));}
  function loadLocal(){
    try{
      let raw=localStorage.getItem(STORE);
      // Migrate invoices saved by the previous local-only build.
      if(!raw){
        const legacy=localStorage.getItem('wahaj-invoices-v1');
        if(legacy){
          const old=JSON.parse(legacy);
          const migrated={
            invoiceNext:Math.max(1,Number(old.nextNumber)||1),
            quotationNext:1,
            invoices:Array.isArray(old.invoices)?old.invoices:[],
            invoiceHistory:Array.isArray(old.history)?old.history:[],
            quotations:[],
            quotationHistory:[]
          };
          saveLocal(migrated);
          return migrated;
        }
        return emptyLocal();
      }
      const d=JSON.parse(raw);
      return {
        invoiceNext:Math.max(1,Number(d.invoiceNext)||1),
        quotationNext:Math.max(1,Number(d.quotationNext)||1),
        invoices:Array.isArray(d.invoices)?d.invoices:[],
        invoiceHistory:Array.isArray(d.invoiceHistory)?d.invoiceHistory:[],
        quotations:Array.isArray(d.quotations)?d.quotations:[],
        quotationHistory:Array.isArray(d.quotationHistory)?d.quotationHistory:[]
      };
    }catch(_){return emptyLocal();}
  }

  async function cloudApi(path,options={}){
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

  // Local REST-shaped handlers so app code can stay the same for both backends.
  function localApi(path,options={}){
    const method=(options.method||'GET').toUpperCase();
    const store=loadLocal();
    const body=options.body?JSON.parse(options.body):null;
    const url=new URL(path,'https://local.wahaj');
    const table=url.pathname.replace(/^\/rest\/v1\//,'');
    const idEq=url.searchParams.get('id');
    const invoiceIdEq=url.searchParams.get('invoice_id');
    const quotationIdEq=url.searchParams.get('quotation_id');

    if(table==='invoices'){
      if(method==='GET'){
        return store.invoices.slice().sort((a,b)=>b.number-a.number);
      }
      if(method==='POST'){
        const now=new Date().toISOString();
        const row={id:uid(),number:store.invoiceNext++,invoice_date:body.invoice_date,client:body.client,data:body.data,created_at:now,updated_at:now};
        store.invoices.push(row);
        store.invoiceHistory.push({id:uid(),invoice_id:row.id,recorded_at:now,data:{data:row.data,number:row.number,client:row.client,invoice_date:row.invoice_date}});
        saveLocal(store);
        return [row];
      }
      if(method==='PATCH'&&idEq&&idEq.startsWith('eq.')){
        const id=idEq.slice(3);
        const idx=store.invoices.findIndex(r=>r.id===id);
        if(idx<0)throw Error('Invoice not found in this browser.');
        const now=new Date().toISOString();
        store.invoices[idx]={...store.invoices[idx],invoice_date:body.invoice_date,client:body.client,data:body.data,updated_at:now};
        store.invoiceHistory.push({id:uid(),invoice_id:id,recorded_at:now,data:{data:body.data,number:store.invoices[idx].number,client:body.client,invoice_date:body.invoice_date}});
        saveLocal(store);
        return [store.invoices[idx]];
      }
      if(method==='DELETE'&&idEq&&idEq.startsWith('eq.')){
        const id=idEq.slice(3);
        store.invoices=store.invoices.filter(r=>r.id!==id);
        store.invoiceHistory=store.invoiceHistory.filter(h=>h.invoice_id!==id);
        saveLocal(store);
        return null;
      }
    }

    if(table==='invoice_history'){
      if(method==='GET'&&invoiceIdEq&&invoiceIdEq.startsWith('eq.')){
        const id=invoiceIdEq.slice(3);
        return store.invoiceHistory.filter(h=>h.invoice_id===id).sort((a,b)=>String(b.recorded_at).localeCompare(String(a.recorded_at)));
      }
      return [];
    }

    if(table==='quotations'){
      if(method==='GET'){
        return store.quotations.slice().sort((a,b)=>b.number-a.number);
      }
      if(method==='POST'){
        const now=new Date().toISOString();
        const row={id:uid(),number:store.quotationNext++,client:body.client,data:body.data,created_at:now,updated_at:now};
        store.quotations.push(row);
        store.quotationHistory.push({id:uid(),quotation_id:row.id,recorded_at:now,data:{data:row.data,number:row.number,client:row.client}});
        saveLocal(store);
        return [row];
      }
      if(method==='PATCH'&&idEq&&idEq.startsWith('eq.')){
        const id=idEq.slice(3);
        const idx=store.quotations.findIndex(r=>r.id===id);
        if(idx<0)throw Error('Quotation not found in this browser.');
        const now=new Date().toISOString();
        store.quotations[idx]={...store.quotations[idx],client:body.client,data:body.data,updated_at:now};
        store.quotationHistory.push({id:uid(),quotation_id:id,recorded_at:now,data:{data:body.data,number:store.quotations[idx].number,client:body.client}});
        saveLocal(store);
        return [store.quotations[idx]];
      }
      if(method==='DELETE'&&idEq&&idEq.startsWith('eq.')){
        const id=idEq.slice(3);
        store.quotations=store.quotations.filter(r=>r.id!==id);
        store.quotationHistory=store.quotationHistory.filter(h=>h.quotation_id!==id);
        saveLocal(store);
        return null;
      }
    }

    if(table==='quotation_history'){
      if(method==='GET'&&quotationIdEq&&quotationIdEq.startsWith('eq.')){
        const id=quotationIdEq.slice(3);
        return store.quotationHistory.filter(h=>h.quotation_id===id).sort((a,b)=>String(b.recorded_at).localeCompare(String(a.recorded_at)));
      }
      return [];
    }

    throw Error('Unsupported local request: '+method+' '+path);
  }

  async function api(path,options={}){
    if(cloudReady()){
      try{return await cloudApi(path,options);}
      catch(e){
        // Fall back to local so saves still work if cloud is down / schema missing.
        console.warn('Supabase request failed, using local save:',e.message);
        return localApi(path,options);
      }
    }
    return localApi(path,options);
  }

  async function ping(){
    if(cloudReady()){
      try{
        await cloudApi('/rest/v1/invoices?select=id&limit=1');
        return {ok:true,mode:'supabase',message:'Connected to Supabase'};
      }catch(e){
        return {ok:true,mode:'local',message:'Supabase unavailable — saving in this browser ('+e.message+')'};
      }
    }
    return {ok:true,mode:'local',message:'Saved in this browser'};
  }

  window.WahajDB={api,ping,cloudReady,config:cfg};
})();
