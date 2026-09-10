import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.116.0";
import "../../../visualiser-styling.js";
const styling=(globalThis as any).ImaniStyling;
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const clean=(v:unknown,max:number)=>String(v??"").trim().slice(0,max);
Deno.serve(async(req:Request)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});if(req.method!=="POST")return new Response("Method not allowed",{status:405,headers:corsHeaders});try{const b=await req.json();const name=clean(b?.name,120),phone=clean(b?.phone,50),email=clean(b?.email,254),guestCount=b?.guest_count?Number(b.guest_count):null;const preferred=clean(b?.preferred_contact,20)||null;const additional=Array.isArray(b?.additional_events)?b.additional_events.slice(0,6).map((e:any)=>({event_type:clean(e?.event_type,100),event_date:clean(e?.event_date,20),venue:clean(e?.venue,180)})).filter((e:any)=>e.event_type||e.event_date||e.venue):[];if(!name||name.length>120||phone.length<3)return new Response(JSON.stringify({error:"Please check your name and phone number."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});if(email&&!/^\S+@\S+\.\S+$/.test(email))return new Response(JSON.stringify({error:"Please enter a valid email address."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});if(guestCount!==null&&(!Number.isInteger(guestCount)||guestCount<1||guestCount>10000))return new Response(JSON.stringify({error:"Please check the guest count."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});if(preferred&&!['whatsapp','phone','email'].includes(preferred))return new Response(JSON.stringify({error:"Please check your preferred contact method."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_ANON_KEY");if(!url||!key)throw new Error("Missing environment configuration");const client=createClient(url,key,{auth:{persistSession:false}});let visualiser: Record<string, unknown> = {};
if (b?.visualiser_design_reference) {
  const venueCode=clean(b.visualiser_venue_code,30), stageCode=clean(b.visualiser_stage_code,30), centrepieceCode=clean(b.visualiser_centrepiece_code,30);
  const reference=`IMANI-${venueCode}-${stageCode}-${centrepieceCode}`;
  const {data:items,error:catalogError}=await client.from("visualiser_items").select("kind,code,name").eq("is_active",true).in("code",[venueCode,stageCode,centrepieceCode]);
  const venueItem=items?.find((x:any)=>x.kind==="venue"&&x.code===venueCode),stageItem=items?.find((x:any)=>x.kind==="stage"&&x.code===stageCode),centrepieceItem=items?.find((x:any)=>x.kind==="centrepiece"&&x.code===centrepieceCode);
  if(catalogError||!venueItem||!stageItem||!centrepieceItem||reference!==b.visualiser_design_reference) return new Response(JSON.stringify({error:"This design is unavailable. Please choose your design again."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
  visualiser={visualiser_design_reference:reference,visualiser_venue_code:venueCode,visualiser_stage_code:stageCode,visualiser_centrepiece_code:centrepieceCode,visualiser_saved:b.visualiser_saved===true};
  let stylingSummary='';
  if(b.visualiser_configuration!==undefined){
    try{
      if(JSON.stringify(b.visualiser_configuration).length>2048)throw new Error('Too many choices');
      const configuration=styling.normalize(b.visualiser_configuration,true);
      const fullReference=reference+'-'+styling.fingerprint(configuration);
      if(b.visualiser_configuration_reference!==fullReference)throw new Error('Design reference mismatch');
      Object.assign(visualiser,{visualiser_configuration:configuration,visualiser_configuration_reference:fullReference});
      stylingSummary='\nComplete design: '+fullReference+'\n'+styling.summary(configuration).join('\n');
    }catch{return new Response(JSON.stringify({error:'Please reopen your design and review the styling choices.'}),{status:400,headers:{...corsHeaders,'Content-Type':'application/json'}})}
  }
  const designSummary=`\n\nVisualiser design: ${reference}\nVenue: ${venueItem.name}\nStage: ${stageCode} ${stageItem.name}\nCentrepiece: ${centrepieceCode} ${centrepieceItem.name}`+stylingSummary;
  b.message=clean(b.message,Math.max(0,3000-designSummary.length))+designSummary;
}
const{error}=await client.from("enquiries").insert({name,phone,email:email||null,event_type:clean(b?.event_type,120)||null,event_date:b?.event_date||null,venue:clean(b?.venue,180)||null,guest_count:guestCount,budget:clean(b?.budget,120)||null,message:clean(b?.message,3000)||null,preferred_contact:preferred,referral_source:clean(b?.referral_source,120)||null,inspiration_url:clean(b?.inspiration_url,500)||null,additional_events:additional,...visualiser,status:"new"});if(error)throw error;return new Response(JSON.stringify({ok:true}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}})}catch(error){console.error(error);return new Response(JSON.stringify({error:"Unable to send enquiry."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}})}});
