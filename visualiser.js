(() => {
  const client=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm',{auth:{persistSession:false,storageKey:'imani-visualiser-public'}});
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage={get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{return false}return true}};
  const safeImage=v=>{try{const u=new URL(v,location.href);return v && (u.protocol==='https:' || (u.origin===location.origin && u.protocol==='http:')) ? u.href : ''}catch{return ''}};
  const kinds=['venue','stage','centrepiece'],params=new URLSearchParams(location.search);
  const ownerPreview=params.get('preview')==='owner';
  let saved=storage.get('imani-design-v1');
  const state={items:[],assets:{},venue:params.get('venue_code')||'V1',stage:params.get('stage_code')||'',centrepiece:params.get('centrepiece_code')||'',slider:0,saved:false,busy:false};
  const complete=()=>Boolean(item('venue')&&item('stage')&&item('centrepiece'));
  const session=storage.get('imani-visualiser-session')||crypto.randomUUID();storage.set('imani-visualiser-session',session);
  const reference=()=> 'IMANI-'+kinds.map(k=>state[k]).join('-');
  function photo(row){
    if(!row)return '';
    const own=row.layer_image_url||row.image_url;
    return safeImage(own&&!own.includes('assets/visualiser/room-')?own:state.assets[row.code]?.image);
  }
  const rows=kind=>state.items.filter(r=>r.kind===kind);
  const item=kind=>rows(kind).find(r=>r.code===state[kind]);
  const eventTimers={};
  function message(text){$('visualiserNote').textContent=text}
  function buttons(){
    for(const id of ['saveDesign','stickySave']) {$(id).disabled=ownerPreview||state.busy||!complete();$(id).textContent=state.busy?'Saving…':state.saved?'✓ Saved':'♡ Save design'}
  }
  function quoteURL(){
    const p=new URLSearchParams({visualiser:'1',intent:'booking',venue:item('venue')?.name||'',venue_code:state.venue,stage_code:state.stage,centrepiece_code:state.centrepiece,design_reference:reference(),saved:state.saved?'1':'0'});
    return 'quote.html?'+p;
  }
  function preview(){
    const venue=item('venue'),stage=item('stage'),cp=item('centrepiece');
    if(!venue)return;
    const background=photo(venue);
    $('visualiserPreview').style.setProperty('--stage-bottom',(state.assets[venue.code]?.stage_bottom||34)+'%');
    for(const id of ['visualiserBefore','visualiserAfter'])$(id).style.backgroundImage=background?'url('+JSON.stringify(background)+')':'none';
    $('visualiserPreview').style.setProperty('--after',state.slider+'%');$('previewSliderLine').style.left=state.slider+'%';
    $('beforeAfter').value=state.slider;$('beforeAfter').disabled=!stage&&!cp;
    $('previewSliderLine').hidden=!stage&&!cp;
    $('stageLayer').className='stage-layer photographic-stage';
    $('stageLayer').innerHTML=stage&&photo(stage)?'<img src="'+esc(photo(stage))+'" alt="'+esc(stage.name)+'">':'';
    $('centrepieceLayer').className='centrepiece-layer photographic-tables';
    $('centrepieceLayer').innerHTML=cp&&photo(cp)?Array.from({length:4},()=>'<img src="'+esc(photo(cp))+'" alt="">').join(''):'';
    const selected=[stage,cp].filter(Boolean).map(x=>x.code+' '+x.name).join(' · ');
    $('previewReference').textContent=complete()?reference():stage?'Add your table styling':'Your empty hall';
    $('previewSummary').innerHTML='<div><strong>'+esc(venue.name)+'</strong><small>'+esc(selected||'Empty hall — choose a stage to begin')+'</small></div>'+(complete()?'<span class="summary-code">'+esc(reference())+'</span>':'');
    const concept=(!venue.image_url||venue.image_url.includes('assets/visualiser/room-'))&&state.assets[venue.code];
    $('placeholderNote').textContent=concept?'AI photographic concept — not an actual photograph of '+venue.name+'. Venue layout and décor are confirmed before booking.':'Visual concept. Final layout and décor availability are confirmed before booking.';
    for(const id of ['quoteDesign','stickyQuote']){
      $(id).href=complete()?quoteURL():'#stageOptions';$(id).setAttribute('aria-disabled',String(!complete()));
    }
    $('compareDesigns').disabled=!complete();
    $('emptyHall').classList.toggle('is-active',state.slider===100||(!stage&&!cp));
    $('styledHall').classList.toggle('is-active',state.slider===0&&Boolean(stage||cp));
    $('styledHall').disabled=!stage&&!cp;
    buttons();
  }
  function renderOptions(kind){
    const target=$(kind==='centrepiece'?'centrepieceOptions':kind+'Options'),scroll=target.scrollLeft;
    target.innerHTML=rows(kind).map(row=>{
      const img=photo(row);
      return '<button class="visual-option '+(state[kind]===row.code?'is-selected':'')+'" type="button" '+(kind==='centrepiece'&&!state.stage?'disabled ':'')+'data-code="'+esc(row.code)+'" aria-pressed="'+(state[kind]===row.code)+'">'+(img?'<img src="'+esc(img)+'" alt="">':'<span class="photo-unavailable">Image pending</span>')+'<span class="option-code">'+esc(row.code)+'</span><strong>'+esc(row.name)+'</strong><small>'+esc(row.short_description)+'</small></button>';
    }).join('');
    target.scrollLeft=scroll;
    target.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      if(state[kind]===b.dataset.code)return;
      state[kind]=b.dataset.code;state.saved=false;state.slider=0;
      if(kind==='venue'){state.stage='';state.centrepiece='';kinds.filter(k=>k!==kind).forEach(renderOptions)}
      renderOptions(kind);if(kind==='stage')renderOptions('centrepiece');preview();message(complete()?'Compare this design, save it or request a booking.':kind==='venue'?'This is your empty hall. Choose a stage below.':'Now choose your table styling.');
      clearTimeout(eventTimers[kind]);eventTimers[kind]=setTimeout(()=>{if(complete())kinds.forEach(k=>record(k).catch(()=>{}))},400);
    });
  }
  async function record(kind){
    if(ownerPreview||!complete())return;
    const payload={id:crypto.randomUUID(),session_key:session,venue_code:state.venue,stage_code:state.stage,centrepiece_code:state.centrepiece,design_reference:reference(),saved:kind==='save',event_kind:kind};
    const {error}=await client.from('visualiser_selections').insert(payload);
    if(error&&error.code!=='23505')throw error;
  }
  async function save(){
    if(state.busy||!complete())return;
    if(state.saved){message('This design is already saved on this device.');return}
    state.busy=true;buttons();
    const snapshot={venue:state.venue,stage:state.stage,centrepiece:state.centrepiece,reference:reference()};
    try{
      await record('save');
      const local=storage.set('imani-design-v1',snapshot);if(local){saved=snapshot;$('restoreDesign').hidden=false}
      state.saved=snapshot.reference===reference();
      message(local?'Saved on this device as '+snapshot.reference+'.':'Saved. Keep reference '+snapshot.reference+' to return to this design.');
    }catch{
      const local=storage.set('imani-design-v1',snapshot);if(local){saved=snapshot;$('restoreDesign').hidden=false}state.saved=false;
      message(local?'Saved on this device only. Online save is unavailable; your design can still be sent with a quote.':'Could not save this design. Please retry or keep reference '+snapshot.reference+'.');
    }finally{state.busy=false;preview()}
  }
  $('saveDesign').onclick=save;$('stickySave').onclick=save;
  $('beforeAfter').oninput=e=>{state.slider=Number(e.target.value);preview()};
  $('resetDesign').onclick=()=>{
    if(!state.items.length)return;
    state.stage='';state.centrepiece='';state.slider=0;state.saved=false;
    kinds.forEach(renderOptions);preview();message('Back to the empty hall. Your saved design is still available.');
  };
  async function load(){
    buttons();
    try{
      let catalog=client;
      if(ownerPreview){
        catalog=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm');
        const {data:{user}}=await catalog.auth.getUser();
        if(!user)throw new Error('Owner access required');
        const {data:profile}=await catalog.from('admin_profiles').select('role,is_active').eq('user_id',user.id).single();
        if(profile?.role!=='owner'||!profile.is_active)throw new Error('Owner access required');
      }
      let query=catalog.from('visualiser_items').select('*');
      if(!ownerPreview)query=query.eq('is_active',true);
      const {data,error}=await query.order('sort_order').order('code');
      if(error)throw error;
      state.items=data||[];
      const response=await fetch('assets/visualiser/photographic-catalogue.json');
      if(!response.ok)throw new Error('Images unavailable');
      state.assets=await response.json();
      if(kinds.some(k=>!rows(k).length))throw new Error('Catalogue incomplete');
      let changed=false;kinds.forEach(k=>{if(state[k]&&!item(k)){state[k]=k==='venue'?rows(k)[0].code:'';changed=true}});
      if(!item('venue'))state.venue=rows('venue')[0].code;
      state.saved=!changed&&saved?.reference===reference();
      kinds.forEach(renderOptions);preview();
      message(changed?'A previous choice is unavailable. Please review the updated design.':state.saved?'Your saved design has been restored.':'Start with your empty hall. Choose a stage, then style the tables.');
    }catch{
      state.items=[];buttons();
      message('The catalogue is temporarily unavailable. Please refresh or use our standard quote form.');
      $('quoteDesign').href='quote.html';$('stickyQuote').href='quote.html';
    }
  }
  $('emptyHall').onclick=()=>{state.slider=100;preview()};
  $('styledHall').onclick=()=>{state.slider=0;preview()};
  for(const id of ['quoteDesign','stickyQuote'])$(id).addEventListener('click',e=>{if(!complete()){e.preventDefault();message('Please choose a stage and centrepiece first.');$('stageOptions').scrollIntoView({behavior:'smooth',block:'center'})}});
  $('restoreDesign').hidden=!saved;
  $('restoreDesign').onclick=()=>{if(!saved)return;kinds.forEach(k=>state[k]=saved[k]);kinds.forEach(k=>{if(!item(k))state[k]=k==='venue'?rows(k)[0].code:''});state.saved=complete()&&saved.reference===reference();state.slider=0;kinds.forEach(renderOptions);preview();message(state.saved?'Your saved design is open.':'Some saved choices are unavailable. Please select replacements.')};
  let comparisons=[];
  $('compareDesigns').onclick=()=>{
    if(!complete())return;
    if(comparisons.some(x=>x.reference===reference())){message('This design is already in your comparison.');return}
    const design={venue:state.venue,stage:state.stage,centrepiece:state.centrepiece,reference:reference()};
    comparisons=[...comparisons,design].slice(-3);
    $('comparisonList').innerHTML=comparisons.map((x,i)=>{
      const find=k=>state.items.find(r=>r.kind===k&&r.code===x[k]);
      return '<article class="comparison-card"><div class="comparison-scene" style="--stage-bottom:'+(state.assets[x.venue]?.stage_bottom||34)+'%"><img class="compare-room" src="'+esc(photo(find('venue')))+'" alt=""><img class="compare-stage" src="'+esc(photo(find('stage')))+'" alt=""><img class="compare-table back left" src="'+esc(photo(find('centrepiece')))+'" alt=""><img class="compare-table back right" src="'+esc(photo(find('centrepiece')))+'" alt=""><img class="compare-table left" src="'+esc(photo(find('centrepiece')))+'" alt=""><img class="compare-table right" src="'+esc(photo(find('centrepiece')))+'" alt=""></div><strong>'+esc(x.reference)+'</strong><p>'+esc(find('stage').name+' · '+find('centrepiece').name)+'</p><button class="btn btn-gold" data-choose="'+i+'">Choose this design</button></article>';
    }).join('');
    $('comparisonSection').hidden=false;
    $('comparisonList').querySelectorAll('[data-choose]').forEach(b=>b.onclick=()=>{const x=comparisons[Number(b.dataset.choose)];kinds.forEach(k=>state[k]=x[k]);state.slider=0;state.saved=false;kinds.forEach(renderOptions);preview();$('visualiserPreview').scrollIntoView({behavior:'smooth',block:'center'});message('Your chosen design is ready. Save or request a booking.')});
    message('Added to comparison. Choose another combination to compare up to three designs.');
  };
  load();
})();
