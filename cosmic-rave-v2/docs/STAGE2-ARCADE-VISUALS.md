# COSMIC RAVE — STAGE 2 ARCADE & VISUAL UPGRADE

## Scope and safety
Branch: `feature/cosmic-rave-v2-stage2`, based on
`feature/cosmic-rave-v2-premium-visuals`. Only `cosmic-rave-v2/` is edited.
Do not merge with `main` or with Work's baseline without approval.

## Playable additions
- New on-lane pickups, always placed on the **only safe lane** in a gate:
  - `dancer`: adult animated female GLB figure, **+300** points.
  - `bottle`: procedural whisky bottle with glass/label, **+200** points.
  - `cash`: visible green rolled $100-style banknote with curled corner, **+250** points.
- They replace occasional old orbs rather than add overlapping obstacles.
- About one special pickup every eight safe gates, cycling through all
  three categories. All regular scoring, shield, collision and combo
  mechanics remain unchanged.
- Different pickup sounds, green/pink/gold bursts, short HUD messages.
- Animated dancer uses Michelle.glb, downloaded asynchronously via Three.js.
  If the external GLB is unavailable, a temporary 2D neon dancer silhouette
  appears instead. A real 3D skinned dancer replaces it when loaded.
- Mobile cleanup frees unique temporary WebGL geometries/materials and stops
  dancer clips after an object leaves the scene.

## UI
- Removed the lower song-title label, **not** the actual VITTY soundtrack.
- Enlarged `МАКАР + ЖЕНЯ` both in the top HUD and as a separate large
  heading on the entry screen.
- Updated the controls hint to explain the three premium rewards.

## Visual second pass
- Reduced the endless-arches effect: hero gates are large only every
  fourth segment; other sectors have less illumination and different
  silhouettes; major curved arcs remain prominent.
- Larger cosmic magenta/cyan portals frame the playable area.
- Added beat-responsive instanced holographic floor reflection shader.
- Retuned exposure, ambient contrast and bloom strength.
- Converted hazard placeholder boxes into layered metallic energy gates,
  with emissive light tubes, translucent warning fields and edge panels.
- Updated existing GLB runner shader to darken blue suit textures while
  preserving flesh/hair materials. Strengthened rhythm-driven upper-body
  movement (head, shoulders, arms, torso), with no leg-animation changes.

## QA completed
- Static syntax checks passed for game logic, character motion,
  fashion shader, tunnel, world, audio, rave-show and app.
- 21 smoke/static checks passed for scores, rendering integration,
  title/track UI, asset wiring and music preservation.
- Simulated a full five-minute route at 30/60 logical steps/sec:
  the safe route remains traversable without health loss.
- Tested +300/+200/+250 pickup scoring once each.
- Simulated InstancedMesh architecture (20 bays, 1300 instances,
  19 batches) and its movement/pulse uniforms. This is not a GPU FPS test.
- Simulated GLB dancer loading, creation of each pickup, animation and
  resource cleanup with mocked Three.js interfaces.

## Not yet verified
- Actual runtime rendering in iOS Safari / Telegram WebView.
- Remote Michelle.glb CORS/connectivity in the user's network.
- The look of green bill and bottle at gameplay resolution.
- Shader compile against the real iPhone WebGL implementation.
- FPS, memory, photo/video quality, complete interactive run.
- Permissions for public use of original VITTY music and the sample GLB.

## Preview
https://raw.githack.com/pf99c88fmv-source/-neon-escape/feature/cosmic-rave-v2-stage2/cosmic-rave-v2/index.html?v=stage2-arcade-1

Wait for user's mobile screenshot and next `го` before another graphics iteration.
