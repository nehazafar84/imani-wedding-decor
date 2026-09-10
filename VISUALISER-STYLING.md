# Complete venue styling

The visualiser starts with an empty hall and builds a photographic concept from independent décor layers. Existing named-venue backgrounds remain clearly labelled AI concepts, not actual venue photography. Thirty-eight new transparent photographic assets replace the combined stage/sofa and table/chair images in the active customer preview.

## Customer choices

- Six stage styles: floral, modern, Walima, traditional, Nikkah and Mehndi.
- Eight centrepieces: tall florals, low rose ball, modern gold, cherry blossom, crystal, candles, lanterns and foliage.
- Round, banquet, sweetheart and U-shaped tables; three chair styles; eight chair/linen/napkin colours; five charger finishes and four cutlery finishes.
- Curtains, arches or panels; classic sofa or royal thrones; floral palettes; floral or candle aisle décor; floral entrance arch; ivory or mirrored walkway.
- Five lighting moods, three seating layouts, 1–12 guest tables and four optional add-ons: cake table, welcome sign, photobooth and stage screen.
- Full-room view, table/place-setting close-up, indicative seating plan, before/after, reset, full-design save/restore and comparison of three designs.
- Mobile View result / Save / Request booking bar.

Table shapes are alternative whole-layout choices. Sweetheart and U-shape each represent one arrangement. Table numbers and seat estimates are planning guides, not a capacity assessment. Colours are approximate filters over photographic cutouts; the visualiser is a layered concept, not a measured 3D model or an inventory availability guarantee.

## Data and replacement assets

`visualiser-styling.js` is the shared data catalogue, normalizer, design fingerprint and readable summary used by the browser and enquiry function. `visualiser-v2.js` renders the customer UI. Extra styling choices are maintained in the shared catalogue; the owner dashboard continues to manage venues, stages and centrepieces.

The owner can replace core catalogue photographs using the existing image upload. New stage cutouts should omit sofas; centrepiece cutouts should omit tables and chairs. Optional styling photographs live in `assets/visualiser/styling/`; replace their catalogue image paths to use approved inventory photographs. Individual prompts and original PNG locations are recorded in `assets/visualiser/STYLING-ASSETS.md`.

To add a selectable styling option, add its catalogue entry and image, update the database validator allowlist in a new migration, redeploy the enquiry function with the shared catalogue, and run the verification script. To add a new kind of object, also define its position in the scene and extend the summary. Existing owner/team permissions remain unchanged.

## Saving and enquiries

The original `IMANI-V1-S1-C1` core reference is preserved. A deterministic 16-character suffix distinguishes complete styling configurations. The full normalized configuration travels in the quote link, saved design, comparison snapshot, `visualiser_selections.configuration`, and `enquiries.visualiser_configuration`. The enquiry function validates the full selection and appends a readable summary to the enquiry message, which the existing booking conversion copies to notes.

Migration: `supabase/migrations/20260910114113_complete_visualiser_styling.sql`. Enquiry function version 4 deployed to project `lgdhudhsorazcjhtisrs`; its existing public endpoint setting is preserved. Configuration validation has explicit execute grants and uses caller permissions. Existing catalogue and selection RLS stays in place. The security advisor reported no new findings; the pre-existing leaked-password-protection warning remains unchanged.

## Verification

Run `node scripts/verify-visualiser.cjs` with Node 22.13+ (uses the built-in TypeScript stripper). It uses a local in-memory database stub and sends no enquiries.

Verified on 10 September 2026:

- 68 styling choices normalize and round-trip; changed choices produce distinct fingerprints; invalid values are rejected.
- Standard enquiry behavior, full configuration persistence, complete booking-note summary and rejection before database writes for invalid designs.
- All 38 WebP assets load, retain alpha transparency and are stored in the repository.
- Browser testing at desktop width and 390 × 844 mobile: no horizontal overflow, 48px mobile action buttons, no browser errors or broken images.
- V1/S1/C2, V2/S6/C8, V3/S4/C7; U-shape quantity is one; 12 banquet tables render; slider endpoints; empty-hall reset; full save/restore; comparison between distinct configurations sharing core codes.
- Successful online save confirmed in Supabase with mirrored walkway and all four add-ons.
- All 17 styling summary entries arrive at the quote form and survive its View / change design round trip. No live customer enquiry was created during testing.

GitHub publishing is separate from public website hosting. This update does not configure or replace the existing WordPress website.
