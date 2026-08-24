# Changelog

## [1.1.2] - 2026-08-24

### Changed

- Document the popup panel positioning behavior: it appears below the trigger by default and flips above when the viewport below is too small.
- Document that `popupOffset` is a global appearance constant (`trPicker.APPEARANCE.popup.offset`), not a constructor option.

### Fixed

- Repair the broken Styling table in the README (an inline paragraph interrupted the table and the `.trpicker-fine-slider` row was duplicated).
- Remove the non-existent `.trpicker-fine-track` / `.trpicker-fine-thumb` / `.trpicker-fine-label` classes from the styling table; these never existed in the source.

### Maintenance

- Bumped the version from 1.1.1 to 1.1.2.

## [1.1.1] - 2026-08-24

### Changed

- Extract a `_cwDist` helper for clockwise minute-distance math, replacing eight duplicated `(a - b + 1440) % 1440` expressions in `trpicker.js`.
- Simplify redundant date parsing in `getDateTimeValues` and update the factory-dispatch error message for the ESM entry.
- Translate the last remaining Chinese comments in `src/` to English.

### Fixed

- GitHub Actions publish workflow lacked the `contents: write` permission, so GitHub Release creation failed on the v1.1.0 tag.
- `1.1.0` could not be re-published (npm permanently reserves published version numbers), so the release now ships as `1.1.1`; the ES module refactor first becomes publicly available here.

### Maintenance

- Bumped the version from 1.1.0 to 1.1.1.

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
