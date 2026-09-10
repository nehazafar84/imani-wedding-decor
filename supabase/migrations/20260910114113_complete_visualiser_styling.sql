-- Keep existing catalogue, enquiry and owner/team RLS. Styling is private with its parent row.
create or replace function public.valid_visualiser_configuration(c jsonb) returns boolean
language plpgsql immutable security invoker set search_path=pg_catalog
as $$
declare k text; v jsonb; allowed jsonb := '{"table":["round","banquet","sweetheart","u"],"chair":["chiavari","louis","ghost"],"chairColour":["ivory","white","blush","champagne","sage","burgundy","navy","black"],"linen":["ivory","white","blush","champagne","sage","burgundy","navy","black"],"napkin":["ivory","white","blush","champagne","sage","burgundy","navy","black"],"charger":["ivory","gold","silver","rose-gold","black"],"cutlery":["gold","silver","rose-gold","black"],"backdrop":["none","curtains","arches","panels"],"aisle":["none","flowers","candles"],"entrance":["none","arch"],"lighting":["warm","white","blush","gold","wash"],"sofa":["none","classic","throne"],"flowers":["original","white","blush","sage","burgundy"],"layout":["aisle","rows","crescent"],"walkway":["none","ivory","mirror"]}'::jsonb;
begin
  if c is null or jsonb_typeof(c)<>'object' or octet_length(c::text)>2048 then return false; end if;
  if c='{}'::jsonb then return true; end if; -- legacy designs
  if (select count(*) from jsonb_object_keys(c))<>17 then return false; end if;
  for k,v in select * from jsonb_each(allowed) loop
    if not(c ? k) or jsonb_typeof(c->k)<>'string' or not(v ? (c->>k)) then return false; end if;
  end loop;
  if not(c ? 'tableCount') or jsonb_typeof(c->'tableCount')<>'number' or (c->>'tableCount') !~ '^(1[0-2]|[1-9])$' then return false; end if;
  if c->>'table' in ('u','sweetheart') and c->>'tableCount'<>'1' then return false; end if;
  if not(c ? 'addons') or jsonb_typeof(c->'addons')<>'array' then return false; end if;
  if jsonb_array_length(c->'addons')>4 then return false; end if;
  for v in select value from jsonb_array_elements(c->'addons') loop
    if jsonb_typeof(v)<>'string' or not('["cake","sign","photobooth","screen"]'::jsonb ? (v #>> '{}')) then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.valid_visualiser_configuration(jsonb) from public;
grant execute on function public.valid_visualiser_configuration(jsonb) to anon,authenticated,service_role;

alter table public.visualiser_selections
  add column configuration jsonb not null default '{}'::jsonb,
  add column configuration_reference text,
  add constraint visualiser_configuration_valid check(public.valid_visualiser_configuration(configuration)),
  add constraint visualiser_configuration_reference_valid check(configuration_reference is null or (length(configuration_reference)<=100 and configuration_reference ~ ('^'||design_reference||'-[0-9A-F]{16}$')));
drop index public.visualiser_event_dedup_idx;
create unique index visualiser_event_dedup_idx on public.visualiser_selections(session_key,design_reference,event_kind,md5(configuration::text));

alter table public.enquiries
  add column visualiser_configuration jsonb not null default '{}'::jsonb,
  add column visualiser_configuration_reference text,
  add constraint enquiry_visualiser_configuration_valid check(public.valid_visualiser_configuration(visualiser_configuration)),
  add constraint enquiry_visualiser_configuration_reference_valid check(visualiser_configuration_reference is null or (visualiser_design_reference is not null and length(visualiser_configuration_reference)<=100 and visualiser_configuration_reference ~ ('^'||visualiser_design_reference||'-[0-9A-F]{16}$')));

insert into public.visualiser_items(kind,code,name,short_description,metadata,sort_order) values
('stage','S6','Mehndi Celebration','Marigold garlands, vibrant flowers and warm brass.','{"is_ai_concept":true,"style":"Mehndi"}',60),
('centrepiece','C6','Candle Glow','Ivory pillar candles in glass hurricane cylinders.','{"is_ai_concept":true,"style":"Candles"}',60),
('centrepiece','C7','Golden Lantern','A gold lantern with candle and leafy base.','{"is_ai_concept":true,"style":"Lanterns"}',70),
('centrepiece','C8','Garden Foliage','A low, lush eucalyptus and fern arrangement.','{"is_ai_concept":true,"style":"Foliage"}',80)
on conflict(kind,code) do nothing;

create or replace function public.visualiser_analytics() returns jsonb
language sql stable security invoker set search_path=public
as $$
select case when (select public.is_imani_owner()) then jsonb_build_object(
'saved',(select count(*) from public.visualiser_selections where saved),
'enquiries',(select count(*) from public.enquiries where visualiser_design_reference is not null),
'converted',(select count(*) from public.enquiries e where visualiser_design_reference is not null and exists(select 1 from public.bookings b where b.enquiry_id=e.id)),
'venue',(select jsonb_build_object('code',venue_code,'count',count(*)) from public.visualiser_selections where event_kind='venue' group by venue_code order by count(*) desc,venue_code limit 1),
'stage',(select jsonb_build_object('code',stage_code,'count',count(*)) from public.visualiser_selections where event_kind='stage' group by stage_code order by count(*) desc,stage_code limit 1),
'centrepiece',(select jsonb_build_object('code',centrepiece_code,'count',count(*)) from public.visualiser_selections where event_kind='centrepiece' group by centrepiece_code order by count(*) desc,centrepiece_code limit 1),
'combination',(select jsonb_build_object('code',coalesce(configuration_reference,design_reference),'count',count(*)) from public.visualiser_selections where saved group by coalesce(configuration_reference,design_reference) order by count(*) desc,coalesce(configuration_reference,design_reference) limit 1)
) else null end
$$;
revoke all on function public.visualiser_analytics() from public,anon;
grant execute on function public.visualiser_analytics() to authenticated;
