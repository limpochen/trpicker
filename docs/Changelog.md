# Changelog

## [1.1.0] - 2026-08-24

### Added

- Refactored the source to ES modules: every module now uses `import`/`export`, with a new aggregate entry (`src/index.js`).
- esbuild-based build producing three distributable formats — `trpicker.mjs` (ESM), `trpicker.js` (CommonJS), and `trpicker.iife.js` (IIFE / CDN) — plus `trpicker.d.ts`.
- Full TypeScript type declarations (`trpicker.d.ts`).
- Added `module` / `types` / `exports` fields to `package.json`; `unpkg` and `jsdelivr` now point to the IIFE bundle.
- ESM demo page (`<script type="module">` importing the source directly).
- Documentable JSDoc convention plus JSDoc coverage for the public API.
- Removed the auto-loading dependency mechanism (unneeded under ESM).

### Changed

- `require('trpicker')` now returns the class directly via a CommonJS unwrap footer.
- Browser bundle size reduced through minification (122.8 KB → ~54.7 KB).

### Maintenance

- Bumped the version from 1.0.0 to 1.1.0.

## [1.0.0] - 2026-08-24

### Added

- First official release on npm (package name `trpicker`).
- MIT license (`LICENSE`).
- Build script producing a single-file bundle (`dist/trpicker.js`), usable via `<script>` or the unpkg / jsdelivr CDN.
- Automated release pipeline: pushing a version tag triggers npm publish and creates a GitHub Release.
- Online demo automatically deployed to GitHub Pages.

### Changed

- Version unified to 1.0.0.
- Project structure refactored from `public/` to `src/`, with build output in `dist/`.
- Build script and `package.json` entry/files updated to match the new structure.

### Maintenance

- Unified the project version to 1.0.0.
