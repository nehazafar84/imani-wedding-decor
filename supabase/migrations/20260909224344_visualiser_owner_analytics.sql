create or replace function public.visualiser_analytics() returns jsonb
language sql stable security invoker set search_path=public
as $$
select case when (select public.is_imani_owner()) then jsonb_build_object(
'saved', (select count(*) from public.visualiser_selections where saved),
'enquiries', (select count(*) from public.enquiries where visualiser_design_reference is not null),
'converted', (select count(*) from public.enquiries e where visualiser_design_reference is not null and exists(select 1 from public.bookings b where b.enquiry_id=e.id)),
'venue', (select jsonb_build_object('code',venue_code,'count',count(*)) from public.visualiser_selections where event_kind='venue' group by venue_code order by count(*) desc,venue_code limit 1),
'stage', (select jsonb_build_object('code',stage_code,'count',count(*)) from public.visualiser_selections where event_kind='stage' group by stage_code order by count(*) desc,stage_code limit 1),
'centrepiece', (select jsonb_build_object('code',centrepiece_code,'count',count(*)) from public.visualiser_selections where event_kind='centrepiece' group by centrepiece_code order by count(*) desc,centrepiece_code limit 1),
'combination', (select jsonb_build_object('code',design_reference,'count',count(*)) from public.visualiser_selections where saved group by design_reference order by count(*) desc,design_reference limit 1)
) else null end
$$;
revoke all on function public.visualiser_analytics() from public,anon;
grant execute on function public.visualiser_analytics() to authenticated;
