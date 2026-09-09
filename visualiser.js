(() => {
  const client=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm',{auth:{persistSession:false,storageKey:'imani-visualiser-public'}});
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage={get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{return false}return true}};
  const safeImage=v=>{try{const u=new URL(v,location.href);return v && (u.protocol==='https:' || (u.origin===location.origin && u.protocol==='http:')) ? u.href : ''}catch{return ''}};
  const kinds=['venue','stage','centrepiece'],params=new URLSearchParams(location.search);
  const ownerPreview=params.get('preview')==='owner';
  const saved=storage.get('imani-design-v1');
  const state={items:[],venue:params.get('venue_code')||saved?.venue||'V1',stage:params.get('stage_code')||saved?.stage||'S1',centrepiece:params.get('centrepiece_code')||saved?.centrepiece||'C1',slider:0,saved:false,busy:false};
  const session=storage.get('imani-visualiser-session')||crypto.randomUUID();storage.set('imani-visualiser-session',session);
  const reference=()=> 'IMANI-'+kinds.map(k=>state[k]).join('-');
  const rows=kind=>state.items.filter(r=>r.kind===kind);
  const item=kind=>rows(kind).find(r=>r.code===state[kind]);
  const eventTimers={};
  function message(text){$('visualiserNote').textContent=text}
  function buttons(){
    for(const id of ['saveDesign','stickySave']) {$(id).disabled=ownerPreview||state.busy||!state.items.length;$(id).textContent=state.busy?'Saving…':state.saved?'✓ Saved':'♡ Save design'}
  }
  function quoteURL(){
    const p=new URLSearchParams({visualiser:'1',venue:item('venue')?.name||'',venue_code:state.venue,stage_code:state.stage,centrepiece_code:state.centrepiece,design_reference:reference(),saved:state.saved?'1':'0'});
    return 'quote.html?'+p;
  }
  function preview(){
    if(kinds.some(k=>!item(k)))return;
    const venue=item('venue'),stage=item('stage'),cp=item('centrepiece');
    const background=safeImage(venue.image_url);
    $('visualiserBefore').style.backgroundImage=background?'url('+JSON.stringify(background)+')':'none';
    $('visualiserAfter').style.backgroundImage=background?'url('+JSON.stringify(background)+')':'none';
    $('visualiserPreview').style.setProperty('--after',state.slider+'%');$('previewSliderLine').style.left=state.slider+'%';
    $('beforeAfter').value=state.slider;
    const stageImage=safeImage(stage.layer_image_url||stage.image_url);
    $('stageLayer').className='stage-layer stage-'+stage.code.toLowerCase();
    $('stageLayer').innerHTML=stageImage?'<img src="'+esc(stageImage)+'" alt="">':'<div class="stage-arch"></div><div class="stage-florals"></div><div class="stage-sofa"></div><div class="stage-plinths"></div>';
    const cpImage=safeImage(cp.layer_image_url||cp.image_url);
    $('centrepieceLayer').className='centrepiece-layer centrepiece-'+cp.code.toLowerCase();
    $('centrepieceLayer').innerHTML=Array.from({length:5},()=>cpImage?'<span class="has-image"><img src="'+esc(cpImage)+'" alt=""></span>':'<span></span>').join('');
    $('previewReference').textContent=reference();
    $('previewSummary').innerHTML='<div><strong>'+esc(venue.name)+'</strong><small>'+esc(stage.code+' '+stage.name+' · '+cp.code+' '+cp.name)+'</small></div><span class="summary-code">'+esc(reference())+'</span>';
    $('placeholderNote').textContent=venue.metadata?.is_placeholder?'Temporary room mockup — not a photograph or accurate layout of '+venue.name+'.':'Concept preview. Final layout and availability are confirmed with Imani Events.';
    $('quoteDesign').href=quoteURL();$('stickyQuote').href=quoteURL();buttons();
  }
  function renderOptions(kind){
    const target=$(kind==='centrepiece'?'centrepieceOptions':kind+'Options'),scroll=target.scrollLeft;
    target.innerHTML=rows(kind).map(row=>{
      const img=safeImage(row.image_url);
      return '<button class="visual-option '+(state[kind]===row.code?'is-selected':'')+'" type="button" data-code="'+esc(row.code)+'" aria-pressed="'+(state[kind]===row.code)+'">'+(img?'<img src="'+esc(img)+'" alt="">':'<span class="design-option-mark '+kind+'-'+esc(row.code.toLowerCase())+'"></span>')+'<span class="option-code">'+esc(row.code)+'</span><strong>'+esc(row.name)+'</strong><small>'+esc(row.short_description)+'</small></button>';
    }).join('');
    target.scrollLeft=scroll;
    target.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      if(state[kind]===b.dataset.code)return;
      state[kind]=b.dataset.code;state.saved=false;
      renderOptions(kind);preview();message('Your design is ready to save or request a quote.');
      clearTimeout(eventTimers[kind]);eventTimers[kind]=setTimeout(()=>record(kind).catch(()=>{}),400);
    });
  }
  async function record(kind){
    if(ownerPreview)return;
    const payload={id:crypto.randomUUID(),session_key:session,venue_code:state.venue,stage_code:state.stage,centrepiece_code:state.centrepiece,design_reference:reference(),saved:kind==='save',event_kind:kind};
    const {error}=await client.from('visualiser_selections').insert(payload);
    if(error&&error.code!=='23505')throw error;
  }
  async function save(){
    if(state.busy||!state.items.length)return;
    if(state.saved){message('This design is already saved on this device.');return}
    state.busy=true;buttons();
    const snapshot={venue:state.venue,stage:state.stage,centrepiece:state.centrepiece,reference:reference()};
    try{
      await record('save');
      const local=storage.set('imani-design-v1',snapshot);
      state.saved=snapshot.reference===reference();
      message(local?'Saved on this device as '+snapshot.reference+'.':'Saved. Keep reference '+snapshot.reference+' to return to this design.');
    }catch{
      const local=storage.set('imani-design-v1',snapshot);state.saved=false;
      message(local?'Saved on this device only. Online save is unavailable; your design can still be sent with a quote.':'Could not save this design. Please retry or keep reference '+snapshot.reference+'.');
    }finally{state.busy=false;preview()}
  }
  $('saveDesign').onclick=save;$('stickySave').onclick=save;
  $('beforeAfter').oninput=e=>{state.slider=Number(e.target.value);preview()};
  $('resetDesign').onclick=()=>{
    if(!state.items.length)return;
    kinds.forEach(k=>state[k]=rows(k)[0].code);state.slider=0;state.saved=false;
    kinds.forEach(renderOptions);preview();message('Design reset. Your previously saved design is still stored on this device.');
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
      if(kinds.some(k=>!rows(k).length))throw new Error('Catalogue incomplete');
      let changed=false;kinds.forEach(k=>{if(!item(k)){state[k]=rows(k)[0].code;changed=true}});
      state.saved=!changed&&saved?.reference===reference();
      kinds.forEach(renderOptions);preview();
      message(changed?'A previous choice is unavailable. Please review the updated design.':state.saved?'Your saved design has been restored.':'Choose a design, then save it or ask us for a quote.');
    }catch{
      state.items=[];buttons();
      message('The catalogue is temporarily unavailable. Please refresh or use our standard quote form.');
      $('quoteDesign').href='quote.html';$('stickyQuote').href='quote.html';
    }
  }
  load();
})();
