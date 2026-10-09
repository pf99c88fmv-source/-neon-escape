# Stage 3 — collectibles and smooth tunnel finish

**Same active working branch:** `feature/cosmic-rave-v2-stage2`. No new branches.
No merge into `main` or Work's `feature/cosmic-rave-v2` branch.

## All gold spheres replaced
- `src/course.js` generates **only** dancer, bottle, cash pickups on its one safe lane.
- Original orb and shield spawns are removed. Normal health, collisions, scoring, bonuses and combo remain.
- Existing exact point values: dancer +300, bottle +200, rolled banknote +250.
- Each of the 268 collectible gates in the full VITTY soundtrack has one of the three designs; only nearby gates are rendered.
- `src/world.js` no longer creates gold orb geometry; small geometric sparkle particles remain as collection feedback.

## Four genuinely different bottles
- New `src/club-collectibles.js` creates whisky, vodka, champagne and cognac shapes, alternating deterministically by event ID.
- Individual coloured glass, contents, differently shaped shoulders, bottle necks, closures, rims and named labels.
- Objects on the route are recognizable 3D game pickups, not flat sprites.

## Rolled dollar banknote
- New green paper texture with dollar signs, 100 numerals, security patterns, ornamental lines, end spirals, hollow opening and a partially unfolded curled corner.
- Tight/looser roll variants, optimised mobile geometry, slight tilt so the open end is visible to the camera.

## Female nightclub performer
- **Adult**, animated GLB Michelle model still driven by its original skeletal SambaDance clip.
- On the copied character's material, a custom shader creates light skin tone, magenta stage bodysuit and deep violet thigh-high boots; original geometry and animations remain.
- The temporary silhouette shown if the external GLB is unavailable is now a coloured illustration of an adult light-skinned performer with long blonde hair and neon club outfit, not a dark silhouette.
- Increased collectible character scale for legibility.
- The external model is still loaded from Three.js examples; loading failures are caught so they do not crash the game. Do not assume successful external GLB load on every mobile network.

## Tunnel and atmosphere
- Smoothed curved tunnel mesh: 88 longitudinal / 10 radial segments.
- Soft low-opacity cyan/magenta luminous arch halos, reduced hard neon glare.
- New `src/tunnel-atmosphere.js`: 18 gently glowing light sprites, five coloured mist patches, 180 moving cosmic-dust points.
- All atmosphere elements share tunnel travel clock and update palette by musical zone.
- LOW preset hides extra atmosphere layers; effects remain subtle on balanced/auto.
- Original VITTY soundtrack and pause fix are unchanged.

## Internal checks completed
- Verified that every on-track pickup is one of three premium types, with exact scoring and a reachable safe lane.
- Full logical route passed at simulated 30/60 updates per second without collisions.
- Smoke-tested construction of all four bottle silhouettes, the rolled 3D dollar and stage material shader, and optional GLB dancer loading.
- Smoke-tested the mobile LOW/normal tunnel atmosphere updates.
- 33 source/logic regression tests passed using an isolated JavaScript harness (not a real iPhone or GPU/WebGL run).

## Real-world tests still required
- Whether the optional external model loads from the user's mobile network.
- Does skin-tone and costume shader compile correctly in iOS Safari/WebGL?
- Do bottle/dollar textures read clearly at game speed?
- FPS/memory, visual sharpness and full mobile gameplay.
- Rights to publicly distribute user-provided VITTY soundtrack and all third-party GLB assets.

## Preview
https://raw.githack.com/pf99c88fmv-source/-neon-escape/feature/cosmic-rave-v2-stage2/cosmic-rave-v2/index.html?v=arcade-finish-2

Do not start a new branch for subsequent visual updates; continue in this branch and commit iteratively.
