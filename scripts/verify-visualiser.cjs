const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
require('../visualiser-styling.js');const M=globalThis.ImaniStyling;
const normal=M.normalize();let checks=0;
for(const g of M.groups)for(const o of g.options){const config=M.normalize({...normal,[g.id]:o.id},true);assert.equal(config[g.id],o.id);assert.deepEqual(M.normalize(JSON.parse(JSON.stringify(config)),true),config);if(o.id!==normal[g.id])assert.notEqual(M.fingerprint(config),M.fingerprint(normal));checks++}
for(const config of [{table:'bad'},{tableCount:0},{tableCount:13},{tableCount:2.2},{addons:['unknown']},{addons:{}},{unknown:'x'},[],null])assert.throws(()=>M.normalize(config,true));
assert.equal(M.normalize({table:'u',tableCount:12}).tableCount,1);
assert.equal(M.normalize({table:'sweetheart',tableCount:8}).tableCount,1);
for(const count of [1,4,8,12])for(const layout of ['aisle','rows','crescent'])assert.equal(M.layout({...normal,tableCount:count,layout}).length,count);
assert.equal(M.fingerprint({...normal,addons:['screen','cake']}),M.fingerprint({...normal,addons:['cake','screen']}));
assert.deepEqual(Object.keys(M.profiles),['V1','V2','V3']);
assert.notDeepEqual(M.profiles.V1.stage,M.profiles.V2.stage);assert.notDeepEqual(M.profiles.V2.stage,M.profiles.V3.stage);
for(const venue of Object.keys(M.profiles)){
  const config=M.normalize({...normal,backdrop:'arches',aisle:'flowers',walkway:'ivory',entrance:'arch',tableCount:12,addons:['cake','sign','photobooth','screen']});
  const plan=M.compose(venue,config,{mode:'full'}),stage=plan.stage;
  assert.ok(stage.left>=0&&stage.bottom>=0&&stage.left+stage.width<=100&&stage.bottom+stage.height<=100&&stage.height<=plan.profile.stage.maxHeight);
  assert.equal(plan.aisle.farBottom,stage.bottom);assert.ok(plan.aisle.farBottom-plan.aisle.nearBottom<=plan.aisle.maxLength);
  assert.equal(plan.florals.length,8);
  for(let i=0;i<4;i++){const left=plan.florals[i*2],right=plan.florals[i*2+1];assert.equal(left.index,right.index);assert.equal(left.bottom,right.bottom);assert.equal(left.width,right.width);assert.equal(left.x+right.x,plan.aisle.center*2);if(i)assert.ok(left.width<plan.florals[(i-1)*2].width)}
  const cake=plan.extras.find(x=>x.id==='cake'),welcome=plan.extras.find(x=>x.kind==='welcome');assert.deepEqual(cake.box,plan.profile.cake);assert.deepEqual(welcome.box,plan.profile.welcome);
  for(const guest of plan.guests){assert.ok(!M.overlaps(guest.box,stage));for(const extra of plan.extras)assert.ok(!M.overlaps(guest.box,extra.box))}
  assert.equal(plan.hidden.outdoor,true);assert.equal(plan.hidden.sign,true);assert.equal(plan.hidden.screen,true);
}
let handler,inserted=[];
const context={Request,Response,console,ImaniStyling:M,Deno:{env:{get:()=> 'test-only'},serve:fn=>{handler=fn}},createClient:()=>({from:table=>({select:()=>({eq:()=>({in:async()=>({data:[{kind:'venue',code:'V1',name:'ICC Wales'},{kind:'stage',code:'S1',name:'Royal Bloom'},{kind:'centrepiece',code:'C1',name:'Classic Tall'}],error:null})})}),insert:async payload=>{inserted.push({table,payload});return {error:null}}})})};
const source=fs.readFileSync(require.resolve('../supabase/functions/submit-enquiry/index.ts'),'utf8').replace(/^import .*;\n/gm,'');
vm.runInNewContext(stripTypeScriptTypes(source),context);
const request=b=>handler(new Request('https://test.invalid/submit-enquiry',{method:'POST',body:JSON.stringify(b),headers:{'Content-Type':'application/json'}}));
const person={name:'Local verification only',phone:'000000',message:'ordinary enquiry'};
(async()=>{
  assert.equal((await request(person)).status,200);assert.equal(inserted.at(-1).payload.message,'ordinary enquiry');assert.equal(inserted.at(-1).payload.visualiser_configuration,undefined);
  const config=M.normalize({table:'banquet',chair:'louis',chairColour:'sage',linen:'blush',napkin:'navy',charger:'silver',cutlery:'rose-gold',backdrop:'arches',sofa:'throne',flowers:'white',aisle:'candles',entrance:'arch',walkway:'mirror',lighting:'wash',layout:'crescent',tableCount:8,addons:['cake','sign','photobooth','screen']});
  const design={...person,visualiser_design_reference:'IMANI-V1-S1-C1',visualiser_venue_code:'V1',visualiser_stage_code:'S1',visualiser_centrepiece_code:'C1',visualiser_configuration:config,visualiser_configuration_reference:'IMANI-V1-S1-C1-'+M.fingerprint(config),message:'x'.repeat(3000)};
  assert.equal((await request(design)).status,200);const saved=inserted.at(-1).payload;
  assert.equal(JSON.stringify(saved.visualiser_configuration),JSON.stringify(config));assert.equal(saved.visualiser_configuration_reference,design.visualiser_configuration_reference);assert.ok(saved.message.length<=3000);for(const line of M.summary(config))assert.ok(saved.message.includes(line),line+' missing from booking notes');
  const writes=inserted.length;
  for(const mutation of [{visualiser_configuration:{...config,lighting:'malicious'}},{visualiser_configuration_reference:'wrong'},{visualiser_stage_code:'S999'},{visualiser_configuration:{...config,addons:['bad']}},{visualiser_configuration:{...config,tableCount:99}}])assert.equal((await request({...design,...mutation})).status,400);
  assert.equal(inserted.length,writes);
  console.log('PASS: '+checks+' catalogue choices; reference identity; layouts; standard enquiry; complete styling persistence; booking-note retention; invalid requests rejected without writes. No network or live enquiries used.');
})().catch(e=>{console.error(e);process.exitCode=1});
