(() => {
  const M=window.ImaniStyling;
  const client=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm',{auth:{persistSession:false,storageKey:'imani-visualiser-public'}});
  const $=id=>document.getElementById(id),kinds=['venue','stage','centrepiece'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage={get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}};
  const safeImage=v=>{try{const u=new URL(v,location.href);return v&&(u.protocol==='https:'||(u.origin===location.origin&&u.protocol==='http:'))?u.href:''}catch{return ''}};
  const params=new URLSearchParams(location.search),ownerPreview=params.get('preview')==='owner';
  let input={},invalidInput=false;
  try{input=params.has('styling')?JSON.parse(params.get('styling')):{};M.normalize(input,true)}catch{input={};invalidInput=true}
  const state={items:[],assets:{},venue:params.get('venue_code')||'V1',stage:params.get('stage_code')||'',centrepiece:params.get('centrepiece_code')||'',config:M.normalize(input),slider:0,saved:false,busy:false,view:'hall'};
  let saved=storage.get('imani-design-v2')||storage.get('imani-design-v1'),comparisons=[],timer;
  const session=storage.get('imani-visualiser-session')||crypto.randomUUID();storage.set('imani-visualiser-session',session);
  const rows=kind=>state.items.filter(r=>r.kind===kind);
  const item=(kind,s=state)=>rows(kind).find(r=>r.code===s[kind]);
  const complete=()=>kinds.every(k=>item(k));
  const base=(s=state)=>'IMANI-'+kinds.map(k=>s[k]).join('-');
  const reference=(s=state)=>base(s)+'-'+M.fingerprint(s.config);
  const snapshot=()=>({venue:state.venue,stage:state.stage,centrepiece:state.centrepiece,config:M.normalize(state.config),reference:reference()});
  const message=text=>$('visualiserNote').textContent=text;
  function photo(row){if(!row)return '';const own=row.layer_image_url||row.image_url;return safeImage(own&&!own.includes('assets/visualiser/room-')?own:state.assets[row.code]?.image)}
  const asset=(group,id)=>M.find(group,id)?.image;
  const img=(src,cls='',style='',alt='')=>src?'<img draggable="false" src="'+esc(src)+'" class="'+cls+'" style="'+style+'" alt="'+esc(alt)+'">':'';
  const stageStyles={S1:'Floral',S2:'Modern',S3:'Walima',S4:'Traditional',S5:'Nikkah',S6:'Mehndi'};
  const cpStyles={C1:'Tall',C2:'Low flowers',C3:'Modern gold',C4:'Cherry blossom',C5:'Crystal',C6:'Candles',C7:'Lanterns',C8:'Foliage'};
  function tableMarkup(s,detail=false){
    const c=s.config,cp=item('centrepiece',s),shape=c.table;
    const chair=asset('chair',c.chair),chairFilter=M.filter('chairColour',c.chairColour);
    let seats=shape==='sweetheart'?2:shape==='u'?8:6;
    let chairs='';
    for(let i=0;i<seats;i++){
      const half=seats/2,front=i>=half,index=i%half,x=14+(index+0.5)*72/half;
      chairs+=img(chair,'dining-chair '+(front?'front-chair':'back-chair'),'left:'+x+'%;filter:'+chairFilter+';'+(front?'bottom:0':'bottom:37%'));
    }
    const settings=Array.from({length:shape==='sweetheart'?2:3},(_,i)=>'<div class="place-setting" style="left:'+(25+i*(shape==='sweetheart'?50:25))+'%">'+img(M.photo('setting-cutlery'),'setting-cutlery','filter:'+M.filter('cutlery',c.cutlery))+img(M.photo('setting-charger'),'setting-charger','filter:'+M.filter('charger',c.charger))+img(M.photo('setting-napkin'),'setting-napkin','filter:'+M.filter('napkin',c.napkin))+'</div>').join('');
    return '<div class="dining-composition shape-'+shape+(detail?' detail-composition':'')+'">'+chairs+img(asset('table',shape),'dining-table','filter:'+M.filter('linen',c.linen))+settings+img(photo(cp),'dining-centrepiece cp-'+s.centrepiece.toLowerCase(),'filter:'+M.filter('flowers',c.flowers))+'</div>';
  }
  function scene(s){
    if(!item('stage',s))return '';
    const c=s.config,stage=item('stage',s),hasTables=Boolean(item('centrepiece',s));
    const bottom=state.assets[s.venue]?.stage_bottom||34;
    let html=img(asset('backdrop',c.backdrop),'decor-backdrop','bottom:'+bottom+'%')+img(photo(stage),'decor-stage','bottom:'+bottom+'%;filter:'+M.filter('flowers',c.flowers));
    html+=img(asset('sofa',c.sofa),'decor-sofa','bottom:'+(bottom-1)+'%');
    html+=img(asset('walkway',c.walkway),'decor-walkway','height:'+(100-bottom)+'%');
    if(hasTables)html+=M.layout(c).map(p=>'<div class="guest-table" style="left:'+p.x+'%;bottom:'+p.y+'%;width:'+p.w+'%;z-index:'+(30-Math.round(p.y))+'">'+tableMarkup(s)+'</div>').join('');
    if(c.aisle!=='none')for(let i=0;i<3;i++)for(const side of [-1,1])html+=img(asset('aisle',c.aisle),'decor-aisle','left:'+(50+side*(9+i*6))+'%;bottom:'+(30-i*12)+'%;width:'+(5+i*2)+'%;z-index:'+(8+i*12));
    html+=img(asset('entrance',c.entrance),'decor-entrance');
    html+=c.addons.map(id=>img(M.addons.find(a=>a.id===id).image,'decor-addon addon-'+id)).join('');
    return html+'<div class="lighting-overlay lighting-'+c.lighting+'"></div>';
  }
  function quoteURL(){return 'quote.html?'+new URLSearchParams({visualiser:'1',intent:'booking',venue:item('venue')?.name||'',venue_code:state.venue,stage_code:state.stage,centrepiece_code:state.centrepiece,design_reference:base(),configuration_reference:reference(),styling:JSON.stringify(state.config),saved:state.saved?'1':'0'})}
  function buttons(){for(const id of ['saveDesign','stickySave']){$(id).disabled=ownerPreview||state.busy||!complete();$(id).textContent=state.busy?'Saving…':state.saved?'✓ Saved':'♡ Save design'}}
  function preview(){
    const venue=item('venue'),stage=item('stage');if(!venue)return;
    const background=photo(venue),decorated=Boolean(stage),isComplete=complete();
    for(const id of ['visualiserBefore','visualiserAfter'])$(id).style.backgroundImage=background?'url('+JSON.stringify(background)+')':'none';
    $('visualiserAfter').innerHTML=scene(state);
    $('visualiserPreview').style.setProperty('--after',state.slider+'%');$('previewSliderLine').style.left=state.slider+'%';
    $('beforeAfter').value=state.slider;$('beforeAfter').disabled=!decorated;$('previewSliderLine').hidden=!decorated||state.slider===0||state.slider===100;
    $('previewReference').textContent=isComplete?reference():decorated?'Choose your centrepiece':'Your empty hall';
    $('previewSummary').innerHTML='<div><strong>'+esc(venue.name)+'</strong><small>'+esc(decorated?item('stage').name+(item('centrepiece')?' · '+item('centrepiece').name:''):'Empty hall — choose a stage to begin')+'</small></div>'+(isComplete?'<span class="summary-code">'+esc(state.config.tableCount+' '+M.find('table',state.config.table).name.toLowerCase()+' table'+(state.config.tableCount>1?'s':''))+'</span>':'');
    const concept=(!venue.image_url||venue.image_url.includes('assets/visualiser/room-'))&&state.assets[venue.code];
    $('placeholderNote').textContent=concept?'AI photographic concept — not an actual photograph of '+venue.name+'. Colours and scale are indicative; the final room and stock are confirmed before booking.':'Visual concept. Colours, layout and stock are confirmed before booking.';
    for(const id of ['quoteDesign','stickyQuote']){$(id).href=isComplete?quoteURL():'#stageOptions';$(id).setAttribute('aria-disabled',String(!isComplete))}
    $('compareDesigns').disabled=!isComplete;$('styledHall').disabled=!decorated;$('emptyHall').classList.toggle('is-active',state.slider===100||!decorated);$('styledHall').classList.toggle('is-active',state.slider===0&&decorated);
    $('tableDetail').innerHTML=isComplete?tableMarkup(state,true):'<p>Choose a stage and centrepiece to see your table close-up.</p>';
    $('placeDetail').innerHTML=isComplete?'<div class="setting-detail" style="background:'+M.find('linen',state.config.linen).hex+'">'+img(M.photo('setting-cutlery'),'setting-cutlery','filter:'+M.filter('cutlery',state.config.cutlery))+img(M.photo('setting-charger'),'setting-charger','filter:'+M.filter('charger',state.config.charger))+img(M.photo('setting-napkin'),'setting-napkin','filter:'+M.filter('napkin',state.config.napkin))+'</div>':'';
    $('designChecklist').innerHTML=isComplete?M.summary(state.config).map(line=>'<li>'+esc(line)+'</li>').join(''):'';
    $('layoutPlan').innerHTML=isComplete?'<div class="plan-stage">Stage</div>'+M.layout(state.config).map((p,i)=>'<span class="plan-table plan-'+state.config.table+'" style="left:'+p.x+'%;top:'+(40+(27-p.y)*1.8)+'%">'+(i+1)+'</span>').join(''):'';
    const perTable={round:8,banquet:10,sweetheart:2,u:24}[state.config.table];
    $('seatingNote').textContent=isComplete?state.config.tableCount+' table'+(state.config.tableCount>1?'s':'')+' · approximately '+(perTable*state.config.tableCount)+' seats. Planning guide only; venue capacity and access need confirmation.':'';
    document.querySelectorAll('[data-detail-view]').forEach(b=>{b.disabled=!isComplete;b.classList.toggle('is-active',b.dataset.detailView===state.view)});
    if(!isComplete&&state.view!=='hall')state.view='hall';
    for(const view of ['hall','table','layout'])$(view+'View').hidden=state.view!==view;
    buttons();
  }
  function renderOptions(kind){
    const target=$(kind+'Options'),scroll=target.scrollLeft;
    target.innerHTML=rows(kind).map(row=>'<button class="visual-option '+(state[kind]===row.code?'is-selected':'')+'" type="button" '+(kind==='centrepiece'&&!state.stage?'disabled ':'')+'data-code="'+esc(row.code)+'" aria-pressed="'+(state[kind]===row.code)+'">'+(photo(row)?'<img loading="lazy" src="'+esc(photo(row))+'" alt="">':'<span class="photo-unavailable">Image pending</span>')+'<span class="option-code">'+esc(row.code)+'</span><strong>'+esc(row.name)+'</strong><small>'+esc((kind==='stage'?stageStyles:cpStyles)[row.code]||row.short_description)+'</small></button>').join('');target.scrollLeft=scroll;
    target.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(state[kind]===b.dataset.code)return;state[kind]=b.dataset.code;if(kind==='venue'){state.stage='';state.centrepiece='';state.config=M.normalize();state.view='hall'}changed();kinds.forEach(renderOptions);renderStyling();message(complete()?'Style every detail below, then compare, save or request your booking.':kind==='venue'?'Your empty hall is ready. Choose a stage.':'Choose your centrepiece to add the guest tables.')});
  }
  function renderStyling(){
    const sections=[['Tables & chairs',['table','chair','chairColour','layout']],['Table colours & place settings',['linen','napkin','charger','cutlery']],['Stage & flowers',['backdrop','sofa','flowers']],['Aisle, entrance & walkway',['aisle','entrance','walkway']],['Lighting & finishing touches',['lighting']]];
    const open=new Set([...$('stylingOptions').querySelectorAll('details[open]')].map(x=>x.dataset.section));
    $('stylingOptions').innerHTML=sections.map(([title,keys],index)=>'<details class="styling-section" data-section="'+index+'" '+(open.has(String(index))?'open':'')+'><summary>'+title+'<span>+</span></summary><div class="styling-section-body">'+keys.map(key=>{
      const g=M.groups.find(x=>x.id===key);return '<fieldset class="styling-group" '+(!state.stage?'disabled':'')+'><legend>'+g.name+'</legend><div class="styling-choices '+(g.options.some(o=>o.hex)?'swatch-choices':'')+'">'+g.options.map(o=>'<button type="button" data-style="'+key+'" data-value="'+o.id+'" aria-pressed="'+(state.config[key]===o.id)+'" class="styling-option '+(state.config[key]===o.id?'is-selected':'')+'">'+(o.image?img(o.image,'choice-photo'):o.hex?'<span class="colour-swatch" style="background:'+o.hex+'"></span>':'')+'<span>'+o.name+'</span></button>').join('')+'</div></fieldset>';
    }).join('')+(index===0?'<label class="quantity-control" for="tableQuantity">Table quantity <output id="tableQuantityValue">'+state.config.tableCount+'</output><input id="tableQuantity" type="range" min="1" max="12" value="'+state.config.tableCount+'" '+(!state.stage||['u','sweetheart'].includes(state.config.table)?'disabled':'')+'></label><p class="control-help">U-shape and sweetheart are single arrangements. Choose round or banquet for multiple guest tables.</p>':'')+(index===4?'<fieldset class="styling-group" '+(!state.stage?'disabled':'')+'><legend>Optional add-ons</legend><div class="styling-choices">'+M.addons.map(a=>'<button type="button" class="styling-option '+(state.config.addons.includes(a.id)?'is-selected':'')+'" data-addon="'+a.id+'" aria-pressed="'+state.config.addons.includes(a.id)+'">'+img(a.image,'choice-photo')+'<span>'+a.name+'</span></button>').join('')+'</div></fieldset>':'')+'</div></details>').join('');
    $('stylingOptions').querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{state.config=M.normalize({...state.config,[b.dataset.style]:b.dataset.value});changed();renderStyling()});
    $('stylingOptions').querySelectorAll('[data-addon]').forEach(b=>b.onclick=()=>{const id=b.dataset.addon,list=state.config.addons;state.config=M.normalize({...state.config,addons:list.includes(id)?list.filter(x=>x!==id):[...list,id]});changed();renderStyling()});
    $('tableQuantity').oninput=e=>{state.config.tableCount=Number(e.target.value);$('tableQuantityValue').textContent=e.target.value;changed()};
  }
  function changed(){state.saved=false;state.slider=0;preview();clearTimeout(timer);timer=setTimeout(()=>{if(complete())kinds.forEach(k=>record(k,snapshot()).catch(()=>{}))},500)}
  async function record(kind,s){if(ownerPreview)return;const {error}=await client.from('visualiser_selections').insert({id:crypto.randomUUID(),session_key:session,venue_code:s.venue,stage_code:s.stage,centrepiece_code:s.centrepiece,design_reference:base(s),configuration:s.config,configuration_reference:s.reference,event_kind:kind,saved:kind==='save'});if(error&&error.code!=='23505')throw error}
  async function save(){
    if(state.busy||!complete()||ownerPreview)return;const s=snapshot();state.busy=true;buttons();
    const local=storage.set('imani-design-v2',s);if(local){saved=s;$('restoreDesign').hidden=false}
    try{await record('save',s);state.saved=reference()===s.reference;message(local?'Your complete design is saved on this device. All choices will go with your booking request.':'Saved online. Keep your design link to reopen it.')}catch{state.saved=false;message(local?'Your complete design is saved on this device. Online save is unavailable; all choices can still be sent with your booking request.':'Save is unavailable. You can still request a booking with all your choices.')}finally{state.busy=false;preview()}
  }
  function restore(s){kinds.forEach(k=>state[k]=s[k]);state.config=M.normalize(s.config);kinds.forEach(k=>{if(!item(k))state[k]=k==='venue'?rows(k)[0]?.code||'':''});state.slider=0;state.saved=complete()&&saved?.reference===reference();kinds.forEach(renderOptions);renderStyling();preview()}
  $('saveDesign').onclick=save;$('stickySave').onclick=save;
  $('resetDesign').onclick=()=>{if(!state.items.length)return;clearTimeout(timer);state.stage='';state.centrepiece='';state.config=M.normalize();state.view='hall';state.saved=false;state.slider=0;kinds.forEach(renderOptions);renderStyling();preview();message('Back to the empty hall. Your saved design is still available.')};
  $('beforeAfter').oninput=e=>{state.slider=Number(e.target.value);preview()};
  $('emptyHall').onclick=()=>{state.slider=100;preview()};$('styledHall').onclick=()=>{state.slider=0;preview()};
  $('restoreDesign').hidden=!saved;$('restoreDesign').onclick=()=>{if(saved){restore(saved);message('Saved design opened. Please review the available choices.')}};
  document.querySelectorAll('[data-detail-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.detailView;preview()});
  $('viewResult').onclick=()=>{$('visualiserWorkspace').scrollIntoView({behavior:'smooth',block:'start'})};
  for(const id of ['quoteDesign','stickyQuote'])$(id).onclick=e=>{if(!complete()){e.preventDefault();message('Choose a stage and centrepiece first.');$('stageOptions').scrollIntoView({behavior:'smooth',block:'center'})}};
  $('compareDesigns').onclick=()=>{
    if(!complete())return;const s=snapshot();if(comparisons.some(x=>x.reference===s.reference)){message('This complete design is already in your shortlist.');return}
    comparisons=[...comparisons,s].slice(-3);
    $('comparisonList').innerHTML=comparisons.map((x,i)=>'<article class="comparison-card"><div class="comparison-scene">'+img(photo(item('venue',x)),'compare-room')+scene(x)+'</div><strong>'+esc(x.reference)+'</strong><p>'+esc(item('stage',x).name+' · '+M.find('table',x.config.table).name+' · '+M.find('linen',x.config.linen).name+' linen')+'</p><details><summary>All design choices</summary><ul>'+M.summary(x.config).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></details><button class="btn btn-gold" data-choose="'+i+'">Choose this design</button></article>').join('');
    $('comparisonSection').hidden=false;$('comparisonList').querySelectorAll('[data-choose]').forEach(b=>b.onclick=()=>{restore(comparisons[Number(b.dataset.choose)]);$('visualiserWorkspace').scrollIntoView({behavior:'smooth',block:'start'});message('All choices from this design are restored. Save or request your booking.')});message('Added to your shortlist. Compare up to three complete designs.');
  };
  async function load(){
    buttons();try{
      let catalog=client;if(ownerPreview){catalog=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm');const {data:{user}}=await catalog.auth.getUser();if(!user)throw new Error('Owner access required');const {data:p}=await catalog.from('admin_profiles').select('role,is_active').eq('user_id',user.id).single();if(p?.role!=='owner'||!p.is_active)throw new Error('Owner access required')}
      let query=catalog.from('visualiser_items').select('*');if(!ownerPreview)query=query.eq('is_active',true);
      const [result,response]=await Promise.all([query.order('sort_order').order('code'),fetch('assets/visualiser/photographic-catalogue.json')]);if(result.error||!response.ok)throw new Error('Catalogue unavailable');state.items=result.data||[];state.assets=await response.json();if(kinds.some(k=>!rows(k).length))throw new Error('Catalogue incomplete');
      let changed=false;kinds.forEach(k=>{if(state[k]&&!item(k)){state[k]=k==='venue'?rows(k)[0].code:'';changed=true}});if(!item('venue'))state.venue=rows('venue')[0].code;
      state.saved=complete()&&saved?.reference===reference();kinds.forEach(renderOptions);renderStyling();preview();message(changed||invalidInput?'Some previous choices were unavailable. Please review your design.':'Start with the empty hall, then choose a stage and style every detail.');
    }catch{state.items=[];buttons();message('The catalogue is temporarily unavailable. Refresh or use the standard quote form.');for(const id of ['quoteDesign','stickyQuote']){$(id).href='quote.html';$(id).removeAttribute('aria-disabled');$(id).onclick=null}}
  }
  load();
})();
