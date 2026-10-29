const PAGE_W=612,PAGE_H=792,LEFT=49.9,RIGHT=562.5,BOTTOM=730,CONTENT_W=RIGHT-LEFT;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let seq=1,quote,assets,logo=null,logoDataUrl=null,latest=null,url=null,timer,revision=0,currentQuote=null,quoteRecords=[];
const nid=()=>'s'+(seq++);

function defaultQuote(){
  return {
    client:'Mrs yasmin',
    description:'Shooting + Editing / Editing Only — talking-ahead & vox-style short-form video content with B-roll and screen recording.',
    sections:[
      {id:'shoot',kind:'packages',variant:'shoot',included:true,title:'Shooting + Editing',description:'Talking ahead + 3 sec × 3 vox style + B-roll / screen recording',packages:[
        {name:'Package 1',videos:4,days:1,price:15000},
        {name:'Package 2',videos:6,days:1,price:22000},
        {name:'Package 3',videos:8,days:1,price:28000}
      ]},
      {id:'edit',kind:'packages',variant:'edit',included:true,title:'Editing Only',description:'Vox-style editing of client-provided footage',packages:[
        {name:'Package 1',videos:4,price:16000},
        {name:'Package 2',videos:6,price:23000},
        {name:'Package 3',videos:8,price:30000}
      ]},
      {id:'custom',kind:'custom',included:true,title:'Customized Package',blurb:'A tailored mix built around your content needs',name:'Custom Package',lines:'5 total videos\n1 shooting day\n2 videos — vox style\n2 videos — talking ahead\n1 video — team building & BTS',price:18000},
      {id:'notes',kind:'notes',included:true,title:'Notes',notes:'Prices are quoted in EGP and exclude any third-party costs (location permits, talent, props) unless otherwise agreed.\nA shooting day covers filming for all videos within that package on a single production day.\nEditing-only packages are based on footage supplied by the client in an editable format.\nTwo rounds of revisions are included per video; additional rounds are billed separately.\nA 50% deposit confirms the booking, with the balance due upon delivery.'}
    ]
  };
}

const MAX_PACKAGES=9;
function blankPackage(variant,index){
  const name='Package '+(index+1);
  if(variant==='shoot')return {name,videos:1,days:1,extra:'',price:0};
  if(variant==='edit')return {name,videos:1,extra:'',price:0};
  return {name,lines:'',price:0};
}

function summaryFor(sec){
  if(sec.kind==='packages')return 'Edit details and packages';
  if(sec.kind==='custom')return 'Edit custom package';
  return 'Edit terms';
}

function packageFields(sec,pkg,i){
  const name=`<label>Package name</label><input data-field="name" maxlength="35" value="${esc(pkg.name)}">`;
  const price=`<label>Investment (EGP)</label><input data-field="price" type="number" min="0" max="99999999" step="1" required value="${pkg.price}">`;
  let mid='';
  if(sec.variant==='shoot')mid=`<div class="row"><div><label>Videos</label><input data-field="videos" type="number" min="1" max="999" step="1" required value="${pkg.videos}"></div><div><label>Shooting days</label><input data-field="days" type="number" min="1" max="99" step="1" required value="${pkg.days}"></div></div>`;
  else if(sec.variant==='edit')mid=`<label>Videos</label><input data-field="videos" type="number" min="1" max="999" step="1" required value="${pkg.videos}">`;
  const extra=sec.variant==='generic'
    ?`<label>Included lines (one per line)</label><textarea data-field="lines" rows="3" placeholder="One point per line">${esc(pkg.lines||pkg.detail||'')}</textarea>`
    :`<label>Extra lines (optional, one per line)</label><textarea data-field="extra" rows="2" placeholder="One point per line">${esc(pkg.extra||'')}</textarea>`;
  return `<div class="package" data-pkg="${i}"><div class="pkg-bar"><b>Package ${i+1}</b><button type="button" class="tiny" data-action="remove-pkg">Remove</button></div>${name}${mid}${extra}${price}</div>`;
}

let forceOpen=null;
function renderSections(){
  const open=new Set([...document.querySelectorAll('#sections details[open]')].map(d=>d.closest('.sec')?.dataset.id).filter(Boolean));
  const first=!$('sections').children.length;
  $('sections').innerHTML=quote.sections.map((sec,index)=>{
    const up=index===0?'disabled':'';
    const down=index===quote.sections.length-1?'disabled':'';
    let body='';
    if(sec.kind==='packages'){
      body=`<label>Service details</label><textarea data-field="description" rows="2" maxlength="500">${esc(sec.description||'')}</textarea>`
        +sec.packages.map((p,i)=>packageFields(sec,p,i)).join('')
        +(sec.packages.length?'' : '<p class="sec-note">No packages yet. The PDF will show only the title and service details.</p>')
        +(sec.packages.length<MAX_PACKAGES?`<button type="button" class="tiny" data-action="add-pkg">Add package</button>`:'');
    }else if(sec.kind==='custom'){
      body=`<label>Subtitle</label><input data-field="blurb" maxlength="160" value="${esc(sec.blurb||'')}"><label>Package name</label><input data-field="name" maxlength="60" value="${esc(sec.name||'')}"><label>Deliverables (one per line)</label><textarea data-field="lines" rows="5">${esc(sec.lines||'')}</textarea><label>Investment (EGP)</label><input data-field="price" type="number" min="0" max="99999999" step="1" required value="${sec.price}">`;
    }else{
      body=`<label>Terms (one per line)</label><textarea data-field="notes" rows="8">${esc(sec.notes||'')}</textarea><p class="sec-note">Leave this section included only when this quotation needs these terms.</p>`;
    }
    const opened=(sec.id===forceOpen||open.has(sec.id)||(first&&sec.id==='shoot'))?' open':'';
    return `<div class="sec${sec.included?'':' off'}" data-id="${esc(sec.id)}"><div class="sec-head"><label class="show"><input type="checkbox" data-field="included"${sec.included?' checked':''}>Include</label><input class="title" data-field="title" maxlength="60" value="${esc(sec.title)}" aria-label="Section title" placeholder="Section name"><span class="move"><button type="button" class="tiny" data-action="up" ${up}>Up</button><button type="button" class="tiny" data-action="down" ${down}>Down</button></span><button type="button" class="tiny" data-action="remove">Remove</button></div><details${opened}><summary>${summaryFor(sec)}</summary>${body}</details></div>`;
  }).join('');
}

function fillClient(){
  $('client').value=quote.client;
  $('description').value=quote.description;
}

function numberValue(input){
  const n=Number(input.value);
  if(!Number.isFinite(n))throw Error('Please complete the highlighted field with a valid number.');
  return n;
}

function sync(){
  if(!$('editor').checkValidity())throw Error('Please complete the highlighted field with a valid number.');
  quote.client=$('client').value.trim();
  quote.description=$('description').value.trim();
  if(!quote.client)throw Error('Enter a client name before generating the quotation.');
  for(const el of document.querySelectorAll('#sections .sec')){
    const sec=quote.sections.find(s=>s.id===el.dataset.id);
    if(!sec)continue;
    sec.included=el.querySelector('[data-field=included]').checked;
    sec.title=el.querySelector('[data-field=title]').value.trim();
    if(sec.kind==='packages'){
      sec.description=el.querySelector('[data-field=description]').value.trim();
      sec.packages.forEach((pkg,i)=>{
        const box=el.querySelector(`[data-pkg="${i}"]`);
        pkg.name=box.querySelector('[data-field=name]').value.trim();
        if(sec.variant!=='generic')pkg.videos=numberValue(box.querySelector('[data-field=videos]'));
        if(sec.variant==='shoot')pkg.days=numberValue(box.querySelector('[data-field=days]'));
        if(sec.variant==='generic')pkg.lines=box.querySelector('[data-field=lines]').value;
        else pkg.extra=box.querySelector('[data-field=extra]').value;
        pkg.price=numberValue(box.querySelector('[data-field=price]'));
      });
    }else if(sec.kind==='custom'){
      sec.blurb=el.querySelector('[data-field=blurb]').value.trim();
      sec.name=el.querySelector('[data-field=name]').value.trim();
      sec.lines=el.querySelector('[data-field=lines]').value;
      sec.price=numberValue(el.querySelector('[data-field=price]'));
    }else sec.notes=el.querySelector('[data-field=notes]').value;
  }
  return quote;
}

async function buildQuotationPdf(data,fontBytes,mark){
  const {PDFDocument,rgb}=PDFLib;
  const pdf=await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular=await pdf.embedFont(fontBytes[0]);
  const bold=await pdf.embedFont(fontBytes[1]);
  const italic=await pdf.embedFont(fontBytes[2]);
  const fallbackRegular=await pdf.embedFont(fontBytes[3]);
  const fallbackBold=await pdf.embedFont(fontBytes[4]);
  const fallbackItalic=await pdf.embedFont(fontBytes[5]);
  const INK=rgb(.12,.12,.12),GRAY=rgb(.42,.42,.42),MUTED=rgb(.55,.55,.55),RULE=rgb(.91,.91,.91),CARD=rgb(.961,.961,.961),BAR=rgb(.102,.102,.102),WHITE=rgb(1,1,1);
  const pages=[];
  let page,y;
  const pick=(font,value)=>{
    if(typeof font.getCharacterSet!=='function')return font;
    const set=font.getCharacterSet();
    const missing=[...String(value)].some(ch=>{const cp=ch.codePointAt(0);return cp>32&&!set.includes(cp);});
    if(!missing)return font;
    if(font===bold)return fallbackBold;
    if(font===italic)return fallbackItalic;
    return fallbackRegular;
  };
  const widthOf=(font,value,size)=>pick(font,value).widthOfTextAtSize(String(value),size);
  function ellipsize(font,value,size,max){
    let text=String(value||'');
    const use=pick(font,text);
    if(use.widthOfTextAtSize(text,size)<=max)return text;
    while(text.length>1&&use.widthOfTextAtSize(text+'…',size)>max)text=text.slice(0,-1);
    return text+'…';
  }
  function wrap(font,value,size,max){
    const lines=[];
    for(const raw of String(value||'').split('\n')){
      const words=raw.split(/\s+/).filter(Boolean);
      if(!words.length)continue;
      let cur='';
      for(const word of words){
        const next=cur?cur+' '+word:word;
        if(widthOf(font,next,size)>max&&cur){lines.push(cur);cur=word;}
        else cur=next;
      }
      if(cur)lines.push(ellipsize(font,cur,size,max));
    }
    return lines;
  }
  function text(pg,value,x,top,size,font,color){
    value=String(value??'');
    if(!value)return;
    font=pick(font,value);
    let actual=size;
    pg.drawText(value,{x,y:PAGE_H-top-actual,size:actual,font,color});
  }
  function rect(pg,x,top,w,h,color){
    if(w<=0||h<=0)return;
    pg.drawRectangle({x,y:PAGE_H-top-h,width:w,height:h,color});
  }
  function drawHeader(pg){
    const label='MEDIA PRODUCTION QUOTATION';
    let cx=LEFT;
    const size=7.7;
    for(const ch of label){
      pg.drawText(ch,{x:cx,y:PAGE_H-36-size,size,font:regular,color:MUTED});
      cx+=regular.widthOfTextAtSize(ch,size)+.85;
    }
    rect(pg,48.5,45.2,515,.55,RULE);
  }
  function addPage(){
    page=pdf.addPage([PAGE_W,PAGE_H]);
    pages.push(page);
    drawHeader(page);
    y=68;
  }
  function ensure(h){if(y+h>BOTTOM)addPage();}
  function cardHeight(lineCount){return 30+(10+lineCount*16+8+1+10+18+12);}
  function drawPrice(pg,x,top,max,amount){
    const label='INVESTMENT',egp='EGP',value=Math.round(Number(amount)||0).toLocaleString('en-US');
    let size=12.6;
    const labelW=widthOf(regular,label,9);
    while(size>7.2&&labelW+8+widthOf(bold,value,size)+4+widthOf(regular,egp,9)>max)size-=.25;
    text(pg,label,x,top+2.4,9,regular,MUTED);
    const vx=x+labelW+8;
    text(pg,value,vx,top,size,bold,INK);
    text(pg,egp,vx+widthOf(bold,value,size)+4,top+2.4,9,regular,MUTED);
  }
  function drawCard(pg,x,top,w,name,lines,lineCount,price){
    const headerH=30,bodyH=10+lineCount*16+8+1+10+18+12;
    rect(pg,x,top,w,headerH,BAR);
    const shown=ellipsize(bold,name||'Package',12,w-26);
    text(pg,shown,x+13,top+(headerH-12)/2,12,bold,WHITE);
    rect(pg,x,top+headerH,w,bodyH,CARD);
    let ly=top+headerH+10;
    for(let i=0;i<lineCount;i++){
      if(lines[i])text(pg,ellipsize(regular,lines[i],10.08,w-26),x+13,ly,10.08,regular,GRAY);
      ly+=16;
    }
    ly+=8;
    rect(pg,x+12,ly,w-24,.6,RULE);
    ly+=11;
    drawPrice(pg,x+13,ly,w-26,price);
  }
  function bullet(line){const t=String(line||'').trim();if(!t)return '';return t.startsWith('—')||t.startsWith('•')?t:'—  '+t;}
  function packageLines(pkg,variant){
    const lines=[];
    if(variant==='shoot'){lines.push('—  '+pkg.videos+' videos');lines.push('—  '+pkg.days+' shooting '+(Number(pkg.days)===1?'day':'days'));}
    else if(variant==='edit')lines.push('—  '+pkg.videos+' videos');
    const extra=variant==='generic'?pkg.lines:pkg.extra;
    for(const line of String(extra||pkg.detail||'').split('\n')){const b=bullet(line);if(b)lines.push(b);}
    return lines.slice(0,8);
  }
  function drawPackageSection(sec){
    const pkgs=sec.packages.slice(0,MAX_PACKAGES);
    const blocks=pkgs.map(p=>packageLines(p,sec.variant));
    const desc=wrap(italic,sec.description,10.08,CONTENT_W).slice(0,6);
    ensure(28+(desc.length*15));
    text(page,ellipsize(bold,sec.title||'Section',15.12,CONTENT_W),LEFT,y,15.12,bold,INK);
    y+=22;
    for(const line of desc){text(page,line,LEFT,y,10.08,italic,GRAY);y+=14.5;}
    y+=desc.length?10:6;
    if(!pkgs.length){y+=8;return;}
    for(let start=0;start<pkgs.length;start+=3){
      const row=pkgs.slice(start,start+3);
      const rowBlocks=blocks.slice(start,start+3);
      const rowLines=rowBlocks.reduce((m,b)=>Math.max(m,b.length),0);
      const cardH=cardHeight(rowLines);
      ensure(cardH+20);
      const n=row.length,gap=n>1?12:0,w=(CONTENT_W-gap*(n-1))/n,top=y;
      row.forEach((p,i)=>drawCard(page,LEFT+i*(w+gap),top,w,p.name,rowBlocks[i],rowLines,p.price));
      y+=cardH+18;
    }
    y+=8;
  }
  function drawCustom(sec){
    const items=String(sec.lines||'').split('\n').map(s=>s.trim()).filter(Boolean).slice(0,12);
    const lines=items.map(l=>'—  '+l);
    const blurb=wrap(italic,sec.blurb,10.08,CONTENT_W).slice(0,4);
    const cardH=cardHeight(lines.length);
    const height=22+(blurb.length?blurb.length*14.5+10:4)+cardH+26;
    ensure(height);
    text(page,ellipsize(bold,sec.title||'Customized Package',15.12,CONTENT_W),LEFT,y,15.12,bold,INK);
    y+=22;
    for(const line of blurb){text(page,line,LEFT,y,10.08,italic,GRAY);y+=14.5;}
    y+=blurb.length?10:4;
    drawCard(page,LEFT,y,CONTENT_W,sec.name||'Package',lines,lines.length,sec.price);
    y+=cardH+26;
  }
  function drawNotes(sec){
    const paragraphs=String(sec.notes||'').split('\n').map(s=>s.trim()).filter(Boolean);
    const bullets=paragraphs.flatMap(p=>wrap(regular,'•  '+p,10.08,CONTENT_W));
    ensure(36);
    text(page,ellipsize(bold,sec.title||'Notes',12,CONTENT_W),LEFT,y,12,bold,INK);
    y+=18;
    rect(page,LEFT,y,CONTENT_W,.6,RULE);
    y+=14;
    for(const line of bullets){
      if(y+16>BOTTOM)addPage();
      text(page,line,LEFT,y,10.08,regular,GRAY);
      y+=16.2;
    }
    y+=12;
  }
  addPage();
  text(page,'PREPARED FOR',LEFT,y,7.9,bold,MUTED);
  y+=16;
  text(page,ellipsize(regular,data.client,12,340),LEFT,y,12,regular,INK);
  y+=28;
  text(page,'Video Production Quotation',LEFT,y,22,bold,INK);
  y+=32;
  const intro=wrap(regular,data.description,10.08,CONTENT_W).slice(0,8);
  for(const line of intro){text(page,line,LEFT,y,10.08,regular,GRAY);y+=14.5;}
  y+=12;
  rect(page,LEFT,y,CONTENT_W,1.2,BAR);
  y+=24;
  if(mark){
    const img=mark.type==='image/png'?await pdf.embedPng(mark.bytes):await pdf.embedJpg(mark.bytes);
    const scale=Math.min(102/img.width,43/img.height);
    pages[0].drawImage(img,{x:450+(102-img.width*scale)/2,y:PAGE_H-64-img.height*scale,width:img.width*scale,height:img.height*scale});
  }else{
    pages[0].drawRectangle({x:450,y:PAGE_H-64-43,width:102,height:43,borderColor:rgb(.78,.78,.78),borderWidth:.6,borderDashArray:[3,3]});
    text(pages[0],'CLIENT LOGO',468,79,8,regular,MUTED);
  }
  for(const sec of data.sections){
    if(!sec.included)continue;
    if(sec.kind==='packages')drawPackageSection(sec);
    else if(sec.kind==='custom')drawCustom(sec);
    else drawNotes(sec);
  }
  pages.forEach((pg,i)=>{
    rect(pg,48.5,742,515,.55,RULE);
    const label=`Page ${i+1} of ${pages.length}`;
    const size=7.9;
    text(pg,label,(PAGE_W-regular.widthOfTextAtSize(label,size))/2,748,size,regular,MUTED);
  });
  pdf.setTitle('Media Production Quotation - '+data.client);
  pdf.setAuthor('Wahaj');
  return pdf.save();
}

function trySync(){try{sync();return true;}catch(e){paint(e.message,true);return false;}}
function paint(message,error){
  $('status').textContent=message;
  $('status').className=error?'error':'';
}
async function refresh(){
  const rev=++revision;
  $('download').disabled=true;
  try{
    const data=sync();
    if(!assets){paint('Loading quotation fonts…');return;}
    paint('Updating PDF preview…');
    const bytes=await buildQuotationPdf(data,assets,logo);
    if(rev!==revision)return;
    latest=bytes;
    if(url)URL.revokeObjectURL(url);
    url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    $('pdfPreview').src=url+'#view=FitH';
    $('openPreview').href=url;
    $('openPreview').hidden=false;
    $('download').disabled=false;
    const count=data.sections.filter(s=>s.included).length;
    paint('PDF ready · '+count+' section'+(count===1?'':'s')+' included');
  }catch(e){
    if(rev!==revision)return;
    latest=null;
    paint(e.message,true);
  }
}
function schedule(){clearTimeout(timer);revision++;$('download').disabled=true;timer=setTimeout(refresh,450);}

function boot(){
  quote=defaultQuote();
  fillClient();
  renderSections();
  $('editor').addEventListener('input',e=>{
    if(e.target.type==='file')return;
    const sec=e.target.closest('.sec');
    if(sec&&e.target.dataset.field==='included')sec.classList.toggle('off',!e.target.checked);
    schedule();
  });
  $('editor').addEventListener('submit',e=>e.preventDefault());
  $('sections').addEventListener('click',e=>{
    const btn=e.target.closest('[data-action]');
    if(!btn||btn.disabled)return;
    e.preventDefault();
    if(!trySync())return;
    const id=btn.closest('.sec').dataset.id;
    const index=quote.sections.findIndex(s=>s.id===id);
    const sec=quote.sections[index];
    const action=btn.dataset.action;
    if(action==='remove')quote.sections.splice(index,1);
    else if(action==='up'&&index>0){[quote.sections[index-1],quote.sections[index]]=[quote.sections[index],quote.sections[index-1]];}
    else if(action==='down'&&index<quote.sections.length-1){[quote.sections[index+1],quote.sections[index]]=[quote.sections[index],quote.sections[index+1]];}
    else if(action==='add-pkg'&&sec.packages.length<MAX_PACKAGES)sec.packages.push(blankPackage(sec.variant,sec.packages.length));
    else if(action==='remove-pkg')sec.packages.splice(Number(btn.closest('[data-pkg]').dataset.pkg),1);
    else return;
    const keep=action==='remove'?null:id;
    forceOpen=keep;
    renderSections();
    forceOpen=null;
    refresh();
  });
  function pushSection(sec){if(!trySync())return;forceOpen=sec.id;quote.sections.push(sec);renderSections();forceOpen=null;const input=document.querySelector(`#sections .sec[data-id="${sec.id}"] [data-field=title]`);if(input){input.focus();input.select();}refresh();}
  $('addSection').onclick=()=>{
    const used=quote.sections.some(s=>s.title.trim().toLowerCase()==='media buying');
    pushSection({id:nid(),kind:'packages',variant:'generic',included:true,title:used?'New section':'Media buying',description:'',packages:[blankPackage('generic',0)]});
  };
  $('addOffer').onclick=()=>pushSection({id:nid(),kind:'custom',included:true,title:'Single offer',blurb:'',name:'Offer',lines:'',price:0});
  $('addNotes').onclick=()=>pushSection({id:nid(),kind:'notes',included:true,title:'Notes',notes:''});
  $('download').onclick=()=>{
    if(!latest)return;
    const a=document.createElement('a');
    a.href=url;
    a.download='Quotation-'+$('client').value.replace(/[^a-zA-Z0-9_-]/g,'-')+'.pdf';
    a.click();
  };
  $('toInvoice').onclick=()=>{
    const client=$('client').value.trim();
    location.href='/invoices/'+(client?'?client='+encodeURIComponent(client):'');
  };
  function clearLogo(){logo=null;logoDataUrl=null;$('logo').value='';$('logoPreview').hidden=true;$('logoLabel').hidden=false;$('removeLogo').hidden=true;}
  async function applyLogoDataUrl(dataUrl){
    if(!dataUrl){clearLogo();return;}
    logoDataUrl=dataUrl;
    const res=await fetch(dataUrl);
    const buf=new Uint8Array(await res.arrayBuffer());
    const type=dataUrl.startsWith('data:image/png')?'image/png':'image/jpeg';
    logo={bytes:buf,type};
    $('logoPreview').src=dataUrl;$('logoPreview').hidden=false;$('logoLabel').hidden=true;$('removeLogo').hidden=false;
  }
  function payloadFromForm(){
    const data=sync();
    return {client:data.client,data:{...data,logo:logoDataUrl||''}};
  }
  function markQuoteEditing(){$('saveQuote').textContent=currentQuote?'Update quotation':'Save quotation'}
  async function saveQuote(){
    $('saveQuote').disabled=true;
    try{
      const row=payloadFromForm();
      const path='/rest/v1/quotations'+(currentQuote?'?id=eq.'+currentQuote.id:'');
      const r=await WahajDB.api(path,{method:currentQuote?'PATCH':'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});
      if(!r?.[0])throw Error('Quotation was not saved.');
      currentQuote=r[0];
      markQuoteEditing();
      clearTimeout(timer);
      paint('Saved quotation '+String(currentQuote.number).padStart(6,'0')+'. Open it anytime from Saved.');
    }catch(e){paint(e.message,true);}
    finally{$('saveQuote').disabled=false;}
  }
  let selectedQuoteId=null;
  function showView(which){
    const archive=which==='archive';
    $('studio').hidden=archive;
    $('archive').hidden=!archive;
    $('studioActions').hidden=archive;
    $('archiveActions').hidden=!archive;
  }
  function sectionSummary(data){
    const sections=Array.isArray(data?.sections)?data.sections:[];
    const included=sections.filter(s=>s.included!==false).length;
    return included+' section'+(included===1?'':'s');
  }
  function paintQuoteList(){
    const q=($('quoteSearch').value||'').toLowerCase();
    const filtered=quoteRecords.filter(r=>(r.client+' '+String(r.number).padStart(6,'0')).toLowerCase().includes(q));
    $('archiveCount').textContent=filtered.length+' of '+quoteRecords.length+' shown';
    if(!filtered.length){
      $('quoteRecords').innerHTML='<div class="archive-empty"><b>No quotations found</b>Save a quotation from the editor, or clear your search.</div>';
      return;
    }
    $('quoteRecords').innerHTML=filtered.map(r=>{
      const active=r.id===selectedQuoteId?' active':'';
      return `<div class="q-row${active}" data-select="${esc(r.id)}"><div class="meta"><b>${String(r.number).padStart(6,'0')} · ${esc(r.client)}</b><span>${esc(new Date(r.updated_at||r.created_at).toLocaleString())} · ${esc(sectionSummary(r.data))}</span></div><div class="btns"><button type="button" data-open="${esc(r.id)}">Open</button><button type="button" data-dup="${esc(r.id)}">Duplicate</button><button type="button" data-del="${esc(r.id)}">Delete</button></div></div>`;
    }).join('');
  }
  async function openSavedQuotes(){
    try{
      quoteRecords=await WahajDB.api('/rest/v1/quotations?select=*&order=number.desc');
      selectedQuoteId=quoteRecords[0]?.id||null;
      paintQuoteList();
      if(selectedQuoteId)await showQuoteRevisions(selectedQuoteId);
      else $('quoteRevisions').innerHTML='<p class="empty">No saved quotations yet.</p>';
      showView('archive');
    }catch(e){paint(e.message,true);}
  }
  async function openQuote(id){
    const row=quoteRecords.find(r=>r.id===id);
    if(!row)return;
    currentQuote=row;
    quote=structuredClone(row.data);
    delete quote.logo;
    fillClient();
    renderSections();
    await applyLogoDataUrl(row.data.logo||'');
    markQuoteEditing();
    showView('studio');
    await refresh();
    paint('Editing quotation '+String(row.number).padStart(6,'0')+'. Update quotation to save changes.');
  }
  async function duplicateQuote(id){
    const row=quoteRecords.find(r=>r.id===id);
    if(!row)return;
    currentQuote=null;
    quote=structuredClone(row.data);
    delete quote.logo;
    fillClient();
    renderSections();
    await applyLogoDataUrl(row.data.logo||'');
    markQuoteEditing();
    showView('studio');
    await refresh();
    paint('Duplicated quotation '+String(row.number).padStart(6,'0')+' as a new draft. Save to create it.');
  }
  async function deleteQuote(id){
    const row=quoteRecords.find(r=>r.id===id);
    if(!row)return;
    if(!confirm('Delete quotation '+String(row.number).padStart(6,'0')+' · '+row.client+'? This cannot be undone.'))return;
    try{
      await WahajDB.api('/rest/v1/quotations?id=eq.'+id,{method:'DELETE'});
      if(currentQuote&&currentQuote.id===id){currentQuote=null;markQuoteEditing();}
      quoteRecords=quoteRecords.filter(r=>r.id!==id);
      if(selectedQuoteId===id)selectedQuoteId=quoteRecords[0]?.id||null;
      paintQuoteList();
      if(selectedQuoteId)await showQuoteRevisions(selectedQuoteId);
      else $('quoteRevisions').innerHTML='<p class="empty">No saved quotations yet.</p>';
      paint('Deleted quotation '+String(row.number).padStart(6,'0')+'.');
    }catch(e){paint(e.message,true);}
  }
  async function showQuoteRevisions(id){
    selectedQuoteId=id;
    paintQuoteList();
    try{
      const rs=await WahajDB.api('/rest/v1/quotation_history?quotation_id=eq.'+id+'&order=recorded_at.desc');
      const row=quoteRecords.find(r=>r.id===id);
      const title=row?`${String(row.number).padStart(6,'0')} · ${esc(row.client)}`:'Quotation';
      $('quoteRevisions').innerHTML=`<p class="empty" style="margin-top:0">${title}</p>`+(rs.length?rs.map((r,n)=>`<details><summary>Revision ${rs.length-n} · ${esc(new Date(r.recorded_at).toLocaleString())}</summary><pre>${esc(JSON.stringify(r.data.data,null,2))}</pre></details>`).join(''):'<p class="empty">No revisions yet.</p>');
    }catch(e){paint(e.message,true);}
  }
  markQuoteEditing();
  $('saveQuote').onclick=()=>saveQuote();
  $('historyBtn').onclick=()=>openSavedQuotes();
  $('backToStudio').onclick=()=>showView('studio');
  $('newFromArchive').onclick=()=>{
    currentQuote=null;markQuoteEditing();quote=defaultQuote();fillClient();renderSections();clearLogo();showView('studio');refresh();
  };
  $('quoteSearch').oninput=()=>paintQuoteList();
  $('quoteRecords').onclick=e=>{
    const open=e.target.closest('[data-open]');
    const dup=e.target.closest('[data-dup]');
    const del=e.target.closest('[data-del]');
    const select=e.target.closest('[data-select]');
    if(open){openQuote(open.dataset.open);return;}
    if(dup){duplicateQuote(dup.dataset.dup);return;}
    if(del){deleteQuote(del.dataset.del);return;}
    if(select)showQuoteRevisions(select.dataset.select);
  };
  $('removeLogo').onclick=()=>{clearLogo();refresh();};
  $('logo').onchange=async()=>{
    const f=$('logo').files[0];
    if(!f)return;
    if(!['image/png','image/jpeg'].includes(f.type)||f.size>5*1024*1024){paint('Choose a PNG or JPG logo under 5 MB.',true);$('logo').value='';return;}
    try{
      const bytes=new Uint8Array(await f.arrayBuffer());
      logo={bytes,type:f.type};
      const reader=new FileReader();
      reader.onload=()=>{logoDataUrl=reader.result;$('logoPreview').src=reader.result;$('logoPreview').hidden=false;$('logoLabel').hidden=true;$('removeLogo').hidden=false;};
      reader.readAsDataURL(f);
      await refresh();
    }catch(e){clearLogo();paint('This logo could not be read. Try another PNG or JPG.',true);}
  };
  $('reset').onclick=()=>{
    if(!confirm('Reset all quotation fields to the original sections?'))return;
    clearTimeout(timer);revision++;currentQuote=null;markQuoteEditing();quote=defaultQuote();fillClient();renderSections();clearLogo();refresh();
  };
  Promise.all(['font-5.ttf','font-11.ttf','font-18.ttf','fallback-regular.ttf','fallback-bold.ttf','fallback-italic.ttf'].map(p=>fetch(p).then(r=>{if(!r.ok)throw Error('Quotation fonts could not be loaded. Reload this page.');return r.arrayBuffer();}))).then(async a=>{
    assets=a;
    await refresh();
    const status=await WahajDB.ping();
    if(status.mode==='local')paint('PDF ready · saves stay in this browser until Supabase keys are added');
  }).catch(e=>paint(e.message,true));
  if(document.modelContext?.registerTool){
    Promise.resolve(document.modelContext.registerTool({name:'set_quotation_client',description:'Set the client name on the current quotation and regenerate its PDF preview.',inputSchema:{type:'object',properties:{client:{type:'string',minLength:1,maxLength:100}},required:['client'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(typeof input.client!=='string'||!input.client.trim()||input.client.length>100)throw Error('Client must be a nonempty name of up to 100 characters.');$('client').value=input.client;await refresh();return {client:$('client').value,pdfReady:!!latest};}})).catch(()=>{});
  }
}

if(typeof globalThis!=='undefined'){globalThis.buildQuotationPdf=buildQuotationPdf;globalThis.defaultQuote=defaultQuote;}
if(typeof document!=='undefined')boot();
