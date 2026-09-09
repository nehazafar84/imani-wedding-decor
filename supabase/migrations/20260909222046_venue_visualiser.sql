-- Venue Visualiser catalogue, anonymous saved designs, and enquiry linkage.
-- The catalogue is intentionally data-driven so the mock assets can be replaced
-- by approved Imani photography or inventory-linked assets later.

create table if not exists public.visualiser_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('venue', 'stage', 'centrepiece')),
  code text not null,
  name text not null,
  short_description text not null default '',
  image_url text,
  layer_image_url text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, code)
);

create index if not exists visualiser_items_kind_active_order_idx
  on public.visualiser_items (kind, is_active, sort_order, code);

create table if not exists public.visualiser_selections (
  id uuid primary key default gen_random_uuid(),
  session_key text not null check (char_length(session_key) between 8 and 120),
  venue_code text not null check (venue_code ~ '^V[0-9A-Z_-]{1,20}$'),
  stage_code text not null check (stage_code ~ '^S[0-9A-Z_-]{1,20}$'),
  centrepiece_code text not null check (centrepiece_code ~ '^C[0-9A-Z_-]{1,20}$'),
  design_reference text not null check (design_reference ~ '^IMANI-V[0-9A-Z_-]+-S[0-9A-Z_-]+-C[0-9A-Z_-]+$'),
  saved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists visualiser_selections_codes_idx
  on public.visualiser_selections (venue_code, stage_code, centrepiece_code, created_at desc);

alter table public.enquiries
  add column if not exists visualiser_selection_id uuid references public.visualiser_selections(id) on delete set null,
  add column if not exists visualiser_design_reference text,
  add column if not exists visualiser_venue_code text,
  add column if not exists visualiser_stage_code text,
  add column if not exists visualiser_centrepiece_code text,
  add column if not exists visualiser_saved boolean not null default false;

create index if not exists enquiries_visualiser_selection_idx
  on public.enquiries (visualiser_selection_id);

alter table public.visualiser_items enable row level security;
alter table public.visualiser_selections enable row level security;

grant select on public.visualiser_items to anon;
grant select on public.visualiser_items to authenticated;
grant insert on public.visualiser_selections to anon;
grant insert on public.visualiser_selections to authenticated;
grant select, insert, update, delete on public.visualiser_items to authenticated;
grant select, update, delete on public.visualiser_selections to authenticated;

drop policy if exists public_can_view_active_visualiser_items on public.visualiser_items;
create policy public_can_view_active_visualiser_items
  on public.visualiser_items for select
  to anon, authenticated
  using (is_active = true or (select is_imani_owner()));

drop policy if exists owner_can_insert_visualiser_items on public.visualiser_items;
create policy owner_can_insert_visualiser_items
  on public.visualiser_items for insert
  to authenticated
  with check ((select is_imani_owner()));

drop policy if exists owner_can_update_visualiser_items on public.visualiser_items;
create policy owner_can_update_visualiser_items
  on public.visualiser_items for update
  to authenticated
  using ((select is_imani_owner()))
  with check ((select is_imani_owner()));

drop policy if exists owner_can_delete_visualiser_items on public.visualiser_items;
create policy owner_can_delete_visualiser_items
  on public.visualiser_items for delete
  to authenticated
  using ((select is_imani_owner()));

drop policy if exists public_can_save_visualiser_selections on public.visualiser_selections;
create policy public_can_save_visualiser_selections
  on public.visualiser_selections for insert
  to anon, authenticated
  with check (saved = true);

drop policy if exists owner_can_read_visualiser_selections on public.visualiser_selections;
create policy owner_can_read_visualiser_selections
  on public.visualiser_selections for select
  to authenticated
  using ((select is_imani_owner()));

drop policy if exists owner_can_update_visualiser_selections on public.visualiser_selections;
create policy owner_can_update_visualiser_selections
  on public.visualiser_selections for update
  to authenticated
  using ((select is_imani_owner()))
  with check ((select is_imani_owner()));

drop policy if exists owner_can_delete_visualiser_selections on public.visualiser_selections;
create policy owner_can_delete_visualiser_selections
  on public.visualiser_selections for delete
  to authenticated
  using ((select is_imani_owner()));

-- Re-use the same owner-only model used by the existing enquiries dashboard.
drop policy if exists owner_can_read_visualiser_linked_enquiries on public.enquiries;
create policy owner_can_read_visualiser_linked_enquiries
  on public.enquiries for select
  to authenticated
  using ((select is_imani_owner()));

insert into public.visualiser_items (kind, code, name, short_description, image_url, metadata, sort_order)
values
  ('venue', 'V1', 'ICC Wales', 'A modern South Wales ballroom reference.', 'assets/venues/icc-wales.webp', '{"rights_note":"Existing local reference asset; replace after venue usage approval."}', 10),
  ('venue', 'V2', 'Cardiff City Hall', 'A grand civic architecture reference.', 'assets/venues/margam-orangery.webp', '{"rights_note":"Temporary local placeholder; replace with approved Cardiff City Hall image."}', 20),
  ('venue', 'V3', 'St Mellons', 'An intimate hotel venue reference.', 'assets/venues/bryn-meadows.webp', '{"rights_note":"Temporary local placeholder; replace with approved St Mellons image."}', 30),
  ('stage', 'S1', 'Royal Bloom', 'Ivory florals, soft gold and a generous arch.', null, '{"tone":"ivory-gold","motif":"floral-arch"}', 10),
  ('stage', 'S2', 'Modern Elegance', 'Clean neutral panels with champagne-gold detail.', null, '{"tone":"sand-gold","motif":"linear-panels"}', 20),
  ('stage', 'S3', 'White Majesty', 'A dramatic all-white floral installation.', null, '{"tone":"white-silver","motif":"cloud-florals"}', 30),
  ('stage', 'S4', 'Cultural Heritage', 'Deep red, burgundy and antique gold styling.', null, '{"tone":"burgundy-gold","motif":"heritage-arches"}', 40),
  ('stage', 'S5', 'Blush Dreams', 'Blush and ivory florals with curved arches.', null, '{"tone":"blush-ivory","motif":"curved-arches"}', 50),
  ('centrepiece', 'C1', 'Classic Tall', 'Tall ivory florals for a timeless table.', null, '{"tone":"ivory","motif":"tall-vase"}', 10),
  ('centrepiece', 'C2', 'Rose Ball', 'A round blush and ivory arrangement.', null, '{"tone":"blush","motif":"rose-ball"}', 20),
  ('centrepiece', 'C3', 'Modern Gold', 'A slim gold stand with white florals.', null, '{"tone":"gold","motif":"gold-stand"}', 30),
  ('centrepiece', 'C4', 'Cherry Blossom', 'Tall blossom branches with a soft silhouette.', null, '{"tone":"blush-white","motif":"blossom-branches"}', 40),
  ('centrepiece', 'C5', 'Crystal Elegance', 'A crystal stand with cascading ivory flowers.', null, '{"tone":"crystal","motif":"crystal-cascade"}', 50)
on conflict (kind, code) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  image_url = excluded.image_url,
  metadata = excluded.metadata,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Tighten the public enquiry insert policy for the new optional fields while
-- keeping existing non-visualiser enquiries valid.
drop policy if exists public_can_submit_enquiries on public.enquiries;
create policy public_can_submit_enquiries
  on public.enquiries for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) between 1 and 120
    and char_length(trim(phone)) between 3 and 50
    and (email is null or char_length(email) <= 254)
    and (guest_count is null or guest_count between 1 and 10000)
    and (preferred_contact is null or preferred_contact in ('whatsapp','phone','email'))
    and char_length(coalesce(referral_source, '')) <= 120
    and char_length(coalesce(inspiration_url, '')) <= 500
    and char_length(coalesce(visualiser_design_reference, '')) <= 80
    and char_length(coalesce(visualiser_venue_code, '')) <= 30
    and char_length(coalesce(visualiser_stage_code, '')) <= 30
    and char_length(coalesce(visualiser_centrepiece_code, '')) <= 30
    and jsonb_typeof(additional_events) = 'array'
    and jsonb_array_length(additional_events) <= 6
    and status = 'new'
  );
