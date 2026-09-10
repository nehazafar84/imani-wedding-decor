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
  globalThis.ImaniStyling={groups,addons,defaults,normalize,fingerprint,summary,find,filter,layout,photo};
})();
