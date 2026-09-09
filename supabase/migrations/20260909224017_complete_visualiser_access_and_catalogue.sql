-- Public catalogue access and validated anonymous visualiser events.
drop policy if exists public_can_view_active_visualiser_items on public.visualiser_items;
create policy public_can_view_active_visualiser_items on public.visualiser_items
for select to anon using (is_active);
create policy authenticated_can_view_visualiser_items on public.visualiser_items
for select to authenticated using (is_active or (select public.is_imani_owner()));

alter table public.visualiser_items add constraint visualiser_code_kind_check check (
  (kind='venue' and code ~ '^V[0-9A-Z_-]{1,20}$') or
  (kind='stage' and code ~ '^S[0-9A-Z_-]{1,20}$') or
  (kind='centrepiece' and code ~ '^C[0-9A-Z_-]{1,20}$')
);
alter table public.visualiser_items add constraint visualiser_name_check check (char_length(trim(name)) between 1 and 100);
alter table public.visualiser_items add constraint visualiser_description_check check (char_length(short_description)<=240);

alter table public.visualiser_selections add column event_kind text not null default 'save'
check(event_kind in ('venue','stage','centrepiece','save'));
alter table public.visualiser_selections add constraint visualiser_reference_matches check(design_reference='IMANI-'||venue_code||'-'||stage_code||'-'||centrepiece_code);
alter table public.visualiser_selections add constraint visualiser_saved_matches check(saved=(event_kind='save'));
create unique index visualiser_event_dedup_idx on public.visualiser_selections(session_key,design_reference,event_kind);
drop policy if exists public_can_save_visualiser_selections on public.visualiser_selections;
create policy public_can_save_visualiser_selections on public.visualiser_selections for insert to anon,authenticated
with check (
  exists(select 1 from public.visualiser_items where kind='venue' and code=venue_code and is_active)
  and exists(select 1 from public.visualiser_items where kind='stage' and code=stage_code and is_active)
  and exists(select 1 from public.visualiser_items where kind='centrepiece' and code=centrepiece_code and is_active)
);
-- Original SVG room placeholders; no unlicensed venue photography.
update public.visualiser_items set image_url='assets/visualiser/room-'||lower(code)||'.svg',
metadata=metadata||'{"is_placeholder":true,"rights_note":"Original schematic placeholder, not a photograph or accurate representation of the named venue."}'::jsonb
where kind='venue' and code in ('V1','V2','V3');

-- Owner-only uploads of replacement images; public delivery is intentional.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('visualiser','visualiser',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy visualiser_owner_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='visualiser' and (select public.is_imani_owner()));
create policy visualiser_owner_storage_select on storage.objects for select to authenticated
using(bucket_id='visualiser' and (select public.is_imani_owner()));
create policy visualiser_owner_storage_update on storage.objects for update to authenticated
using(bucket_id='visualiser' and (select public.is_imani_owner()))
with check(bucket_id='visualiser' and (select public.is_imani_owner()));
