# Venue Visualiser MVP

Customer route: `visualiser.html`. Owner route: `admin-visualiser.html`.

The catalogue comes from Supabase project `lgdhudhsorazcjhtisrs`. The three named venues use original SVG room placeholders, explicitly labelled as neither photographs nor accurate layouts. Five stage and five centrepiece concepts use CSS illustrations. Owner uploads can replace these with approved images; use transparent PNG/WebP for overlays. Replacing a venue photograph may require adjusting overlay positions for its perspective.

Choose a venue, stage and centrepiece; compare the room using the keyboard-accessible slider. Save stores the current combination on this device and records an anonymous saved-design event. A design reference identifies a combination, not an individual customer. Quote links include the reference and codes. The existing `submit-enquiry` function validates active choices and writes the selection fields and readable design details to the enquiry. Existing booking conversion carries the enquiry message into booking notes.

Only active owners can manage the catalogue and read analytics. Team members retain their existing permissions. Public visitors can read visible items and insert validated selection events, but cannot read customer selections or analytics. Owner image uploads use the `visualiser` storage bucket (PNG, JPEG or WebP, 5 MB maximum).

Analytics count unique selection events per browser session key, combination and event type. Saved combinations count once per browser/combination. Conversion is visualiser enquiries with a linked booking divided by all visualiser enquiries. Anonymous analytics are indicative and can be affected by blocked storage or automated traffic.

## Deployment

Static files need no build step. Preserve relative paths when hosting under a repository subdirectory. Supabase migrations in this repository are the visualiser additions to the existing Imani database, not a standalone bootstrap of all booking/admin tables. Their filenames match the applied remote migration history. The quote Edge Function source is included in `supabase/functions/submit-enquiry/index.ts`; its deployment keeps JWT verification disabled for the existing public enquiry flow. Never place a service-role key in website files.

## Release verification

- JavaScript syntax checks passed for the six changed/new application scripts.
- Public catalogue API returned all 13 active items; anonymous saved-data and analytics reads were denied; a quote with an unavailable design was rejected.
- Browser checks at desktop and 390 px mobile: preview rendering, comparison slider, save, reload/restore, mobile sticky actions, no horizontal page overflow and quote reference/venue handoff.
- Owner/team policies were reviewed against the existing `is_imani_owner()` helper. A signed-in owner CRUD/upload session and a full test-enquiry-to-booking conversion still need an authenticated acceptance check; the available database connection does not permit impersonating those roles.
- Supabase security advisor reported no visualiser policy findings. Its existing leaked-password-protection warning remains a separate Auth setting: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
