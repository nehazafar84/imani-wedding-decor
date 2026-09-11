/* Shared catalogue and validation: browser and submit-enquiry use this same file. */
(() => {
  const photo = id => 'assets/visualiser/styling/'+id+'.webp';
  const option = (id,name,asset) => ({id,name,...(asset?{image:photo(asset)}:{})});
  const none = () => option('none','None');
  const colours = [
    {id:'ivory',name:'Ivory',hex:'#f5eee1',filter:'none'},
    {id:'white',name:'White',hex:'#ffffff',filter:'grayscale(1) brightness(1.12)'},
    {id:'blush',name:'Blush',hex:'#d5a2a9',filter:'sepia(1) saturate(1.7) hue-rotate(290deg) brightness(.87)'},
    {id:'champagne',name:'Champagne',hex:'#ceb68b',filter:'sepia(.8) saturate(1.3) brightness(.88)'},
    {id:'sage',name:'Sage',hex:'#9da990',filter:'sepia(1) saturate(.65) hue-rotate(45deg) brightness(.76)'},
    {id:'burgundy',name:'Burgundy',hex:'#723344',filter:'sepia(1) saturate(3.5) hue-rotate(300deg) brightness(.43)'},
    {id:'navy',name:'Navy',hex:'#293b59',filter:'sepia(1) saturate(3) hue-rotate(165deg) brightness(.4)'},
    {id:'black',name:'Black',hex:'#292725',filter:'grayscale(1) brightness(.22)'}
  ];
  const metals = [colours[0],{id:'gold',name:'Gold',hex:'#c4a25d',filter:'sepia(.85) saturate(.8) brightness(.87)'},{id:'silver',name:'Silver',hex:'#bfc3c5',filter:'grayscale(1) brightness(.94)'},{id:'rose-gold',name:'Rose gold',hex:'#be8980',filter:'sepia(1) saturate(1.6) hue-rotate(320deg) brightness(.8)'},colours[7]];
  const groups = [
    {id:'table',name:'Table shape',options:[option('round','Round','table-round'),option('banquet','Banquet','table-banquet'),option('sweetheart','Sweetheart','table-sweetheart'),option('u','U-shape','table-u')]},
    {id:'chair',name:'Chair style',options:[option('chiavari','Chiavari','chair-chiavari'),option('louis','Louis oval','chair-louis'),option('ghost','Clear ghost','chair-ghost')]},
    {id:'chairColour',name:'Chair colour',options:colours},
    {id:'linen',name:'Table linen',options:colours},
    {id:'napkin',name:'Napkin colour',options:colours},
    {id:'charger',name:'Charger plate',options:metals},
    {id:'cutlery',name:'Cutlery',options:metals.filter(x=>x.id!=='ivory')},
    {id:'backdrop',name:'Backdrop',options:[none(),option('curtains','Soft curtains','backdrop-curtains'),option('arches','Layered arches','backdrop-arches'),option('panels','Fluted panels','backdrop-panels')]},
    {id:'aisle',name:'Aisle décor',options:[none(),option('flowers','Floral meadows','aisle-flowers'),option('candles','Candle aisle','aisle-candles')]},
    {id:'entrance',name:'Entrance décor',options:[none(),option('arch','Floral entrance arch','entrance-arch')]},
    {id:'lighting',name:'Lighting',options:[option('warm','Warm'),option('white','White'),option('blush','Blush'),option('gold','Gold'),option('wash','Colour wash')]},
    {id:'sofa',name:'Sofa / throne',options:[none(),option('classic','Classic loveseat','sofa-classic'),option('throne','Royal thrones','sofa-throne')]},
    {id:'flowers',name:'Floral palette',options:[option('original','Original flowers'),{...colours[1],name:'White & ivory'},colours[2],colours[4],colours[5]]},
    {id:'layout',name:'Seating layout',options:[option('aisle','Central aisle'),option('rows','Balanced rows'),option('crescent','Open centre')]},
    {id:'walkway',name:'Walkway',options:[none(),option('ivory','Ivory carpet','walkway-ivory'),option('mirror','Champagne mirror','walkway-mirror')]}
  ];
  const addons=[option('cake','Cake table','addon-cake'),option('sign','Welcome sign','addon-sign'),option('photobooth','Photobooth','addon-photobooth'),option('screen','Stage screen','addon-screen')];
  const defaults={table:'round',chair:'chiavari',chairColour:'ivory',linen:'ivory',napkin:'ivory',charger:'gold',cutlery:'gold',backdrop:'none',aisle:'none',entrance:'none',lighting:'warm',sofa:'classic',flowers:'original',layout:'aisle',walkway:'none',tableCount:4,addons:[]};
  /* Venue-aware composition profiles. Coordinates are percentages of the
     photographic preview, measured from the left and bottom edges. Each room
     owns its own zones: décor is never positioned by a customer or shared
     blindly between venues. */
  const profiles={
    V1:{name:'ICC Wales',indoor:true,
      stage:{left:24,bottom:34,width:52,height:43,maxHeight:46},
      aisle:{center:50,nearBottom:0,farBottom:34,nearWidth:28,farWidth:8,maxLength:34},
      guest:[{x:12,bottom:0,width:20},{x:88,bottom:0,width:20},{x:14,bottom:20,width:14},{x:86,bottom:20,width:14},{x:19,bottom:35,width:9},{x:81,bottom:35,width:9}],
      cake:{left:80,bottom:39,width:10,height:17},welcome:{left:3,bottom:39,width:10,height:22},
      extra:{left:88,bottom:31,width:9,height:22},outdoor:null},
    V2:{name:'Cardiff City Hall',indoor:true,
      stage:{left:27,bottom:30,width:46,height:42,maxHeight:44},
      aisle:{center:49,nearBottom:0,farBottom:30,nearWidth:24,farWidth:7,maxLength:30},
      guest:[{x:11,bottom:0,width:19},{x:89,bottom:0,width:19},{x:15,bottom:19,width:13},{x:85,bottom:19,width:13},{x:21,bottom:33,width:9},{x:79,bottom:33,width:9}],
      cake:{left:81,bottom:36,width:9,height:16},welcome:{left:4,bottom:37,width:9,height:21},
      extra:{left:89,bottom:27,width:8,height:21},outdoor:null},
    V3:{name:'St Mellons',indoor:true,
      stage:{left:29,bottom:32,width:42,height:39,maxHeight:41},
      aisle:{center:51,nearBottom:0,farBottom:32,nearWidth:21,farWidth:6,maxLength:32},
      guest:[{x:12,bottom:0,width:18},{x:89,bottom:0,width:18},{x:16,bottom:19,width:12},{x:85,bottom:19,width:12},{x:23,bottom:33,width:8},{x:78,bottom:33,width:8}],
      cake:{left:82,bottom:36,width:9,height:15},welcome:{left:4,bottom:37,width:9,height:20},
      extra:{left:89,bottom:29,width:8,height:19},outdoor:null}
  };
  const presets=[
    {id:'classic-luxury',name:'Classic Luxury',stage:'S1',centrepiece:'C1',config:{backdrop:'curtains',sofa:'classic',flowers:'white',linen:'ivory',napkin:'champagne',charger:'gold',cutlery:'gold',chair:'chiavari',chairColour:'ivory',aisle:'flowers',walkway:'ivory',lighting:'gold',addons:['cake']}},
    {id:'modern-ivory',name:'Modern Ivory',stage:'S2',centrepiece:'C3',config:{backdrop:'arches',sofa:'none',flowers:'white',linen:'white',napkin:'ivory',charger:'silver',cutlery:'silver',chair:'ghost',chairColour:'white',aisle:'candles',walkway:'mirror',lighting:'white',addons:[]}},
    {id:'blush-romance',name:'Blush Romance',stage:'S5',centrepiece:'C4',config:{backdrop:'curtains',sofa:'classic',flowers:'blush',linen:'ivory',napkin:'blush',charger:'rose-gold',cutlery:'gold',chair:'louis',chairColour:'ivory',aisle:'flowers',walkway:'ivory',lighting:'blush',addons:['cake']}}
  ];
  function normalize(value={},strict=false){
    if(!value||typeof value!=='object'||Array.isArray(value)) {if(strict)throw new Error('Invalid styling');value={}}
    if(strict&&Object.keys(value).some(k=>!Object.hasOwn(defaults,k)))throw new Error('Unknown styling choice');
    const result={};
    for(const g of groups){const v=value[g.id]??defaults[g.id];if(strict&&!g.options.some(x=>x.id===v))throw new Error('Invalid '+g.name);result[g.id]=g.options.some(x=>x.id===v)?v:defaults[g.id]}
    const count=value.tableCount??defaults.tableCount;
    if(strict&&(!Number.isInteger(count)||count<1||count>12))throw new Error('Choose 1–12 tables');
    result.tableCount=Number.isInteger(count)?Math.max(1,Math.min(12,count)):defaults.tableCount;
    const list=value.addons??[];
    if(strict&&(!Array.isArray(list)||list.length>4||list.some(id=>!addons.some(a=>a.id===id))))throw new Error('Invalid add-on');
    result.addons=Array.isArray(list)?addons.filter(a=>list.includes(a.id)).map(a=>a.id):[];
    if(result.table==='u'||result.table==='sweetheart')result.tableCount=1;
    return result;
  }
  function fingerprint(value){
    const text=JSON.stringify(normalize(value));let a=2166136261,b=5381;
    for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i)}
    return (a>>>0).toString(16).padStart(8,'0').toUpperCase()+(b>>>0).toString(16).padStart(8,'0').toUpperCase();
  }
  const find=(key,id)=>groups.find(g=>g.id===key)?.options.find(o=>o.id===id);
  const filter=(key,id)=>find(key,id)?.filter||'none';
  function summary(value){const c=normalize(value);return groups.map(g=>g.name+': '+find(g.id,c[g.id]).name).concat(['Table quantity: '+c.tableCount,'Add-ons: '+(addons.filter(a=>c.addons.includes(a.id)).map(a=>a.name).join(', ')||'None')]);}
  function layout(value){
    const c=normalize(value),n=c.tableCount;
    if(c.table==='u')return [{x:50,y:8,w:70}];
    if(c.table==='sweetheart')return [{x:50,y:9,w:28}];
    const rowCount=Math.ceil(n/(c.layout==='rows'?3:2)),out=[];
    for(let i=0;i<n;i++){
      const columns=c.layout==='rows'?3:2,row=Math.floor(i/columns),col=i%columns;
      const t=rowCount===1?1:row/(rowCount-1),w=(rowCount>3?9:columns===3?15:18)+(rowCount>3?17:columns===3?9:13)*t;
      let x=columns===3?[19,50,81][col]:[22-5*t,78+5*t][col];
      if(c.layout==='crescent')x=col===0?18-2*t:82+2*t;
      const y=(rowCount>3?37:27)-(rowCount>3?35:25)*t;
      out.push({x,y,w});
    }
    return out;
  }
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const box=(left,bottom,width,height)=>({left:clamp(left,0,100-width),bottom:clamp(bottom,0,100-height),width:clamp(width,1,100),height:clamp(height,1,100)});
  const overlaps=(a,b,pad=0)=>a.left+a.width>b.left-pad&&a.left<b.left+b.width+pad&&a.bottom+a.height>b.bottom-pad&&a.bottom<b.bottom+b.height+pad;
  function compose(venueCode,value={},options={}){
    const config=normalize(value),profile=profiles[venueCode]||profiles.V1,full=options.mode==='full';
    const stage=box(profile.stage.left,profile.stage.bottom,profile.stage.width,Math.min(profile.stage.height,profile.stage.maxHeight));
    const aisleActive=config.walkway!=='none'||config.aisle!=='none';
    const length=Math.min(profile.aisle.maxLength,Math.max(0,profile.aisle.farBottom-profile.aisle.nearBottom));
    const aisle={...profile.aisle,farBottom:profile.aisle.nearBottom+length,active:aisleActive};
    const reserved=[stage];
    const extras=[];
    const add=(id,zone,kind)=>{const b=box(zone.left,zone.bottom,zone.width,zone.height);if(reserved.some(x=>overlaps(b,x,1)))return false;reserved.push(b);extras.push({id,kind,box:b});return true};
    /* Cake and welcome zones are reserved before guest tables, so furniture
       can never clash with seating. Redundant welcome/stage pieces are omitted
       in the curated full-design mode. */
    if(full&&config.addons.includes('cake'))add('cake',profile.cake,'cake');
    if(config.entrance!=='none')add('entrance',profile.welcome,'welcome');
    else if(config.addons.includes('sign'))add('sign',profile.welcome,'welcome');
    if(full&&config.addons.includes('photobooth'))add('photobooth',profile.extra,'extra');
    if(full&&config.addons.includes('screen')&&config.backdrop==='none')add('screen',profile.extra,'extra');
    const outdoorOnly=['outdoor-lounge','garden-arch','outdoor-bar'];
    if(!profile.indoor&&profile.outdoor)for(const id of config.addons.filter(x=>outdoorOnly.includes(x)))add(id,profile.outdoor,'outdoor');
    const aisleBounds=aisleActive?box(aisle.center-aisle.nearWidth/2,aisle.nearBottom,aisle.nearWidth,length):null;
    const guests=[];
    for(const slot of profile.guest.slice(0,Math.min(config.tableCount,profile.guest.length))){
      /* Collision footprint is the table/furniture base, not transparent image
         padding or the tall centrepiece canopy above it. */
      const height=slot.width*(config.table==='banquet'?0.5:config.table==='sweetheart'?0.65:config.table==='u'?0.48:0.78);
      const b=box(slot.x-slot.width/2,slot.bottom,slot.width,height);
      if((aisleBounds&&overlaps(b,aisleBounds,1))||reserved.some(x=>overlaps(b,x,1))||guests.some(x=>overlaps(b,x.box,.5)))continue;
      guests.push({x:slot.x,bottom:slot.bottom,width:slot.width,box:b});
    }
    const florals=[];
    if(config.aisle!=='none'){
      const count=4;
      for(let i=0;i<count;i++){
        const t=i/(count-1),bottom=aisle.nearBottom+t*length;
        const half=aisle.nearWidth*.57*(1-t)+(aisle.farWidth*.72)*t;
        const width=7.5*(1-t)+3.4*t;
        for(const side of [-1,1])florals.push({side,index:i,x:aisle.center+side*half,bottom,width,z:25-i});
      }
    }
    return {profile,stage,aisle,guests,florals,extras,hidden:{outdoor:profile.indoor,screen:full&&config.addons.includes('screen')&&config.backdrop!=='none',sign:config.entrance!=='none'&&config.addons.includes('sign')},visibleTableCount:guests.length};
  }
  globalThis.ImaniStyling={groups,addons,defaults,profiles,presets,normalize,fingerprint,summary,find,filter,layout,compose,overlaps,photo};
})();
