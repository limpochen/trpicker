/**
 * trPicker build script
 * =====================
 * Bundles the ESM source into three distributable formats with esbuild:
 *   - trpicker.mjs       ES Module (modern bundlers / `import`)
 *   - trpicker.js        CommonJS (legacy tooling / `require`)
 *   - trpicker.iife.js   IIFE (`<script>` / CDN), global `trPicker`
 * plus the TypeScript declarations.
 *
 * Usage: node build.js
 */
'use strict';

const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const root = __dirname;
const outdir = path.join(root, 'dist');
const jsEntry = path.join(root, 'src', 'index.js');
const dtsSource = path.join(root, 'src', 'trpicker.d.ts');
const pkg = require(path.join(root, 'package.json'));

/**
 * Shared esbuild options for every output format.
 * - target: es2020 keeps optional chaining / nullish coalescing but drops newer
 *   syntax for wider browser support.
 * - minify: production bundle.
 */
const COMMON = {
  entryPoints: [jsEntry],
  bundle: true,
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false,
  legalComments: 'none',
};

/**
 * IIFE convenience footer: esbuild's globalName is the module namespace, so the
 * default export lives at `trPicker.default`. This re-exposes it directly as
 * `window.trPicker` so `<script>` users can write `new trPicker(...)`.
 */
const IIFE_FOOTER = 'if (typeof window !== "undefined" && window.trPicker && window.trPicker.default) window.trPicker = window.trPicker.default;';

/**
 * CommonJS convenience footer: esbuild wraps the default export as
 * `module.exports.default`. Unwrap it so `const trPicker = require('trpicker')`
 * yields the class directly.
 */
const CJS_FOOTER = 'if (module.exports && module.exports.default) module.exports = module.exports.default;';

async function build() {
  // Start from a clean output directory so stale artifacts never leak through.
  fs.rmSync(outdir, { recursive: true, force: true });
  fs.mkdirSync(outdir, { recursive: true });

  // ESM bundle (modern bundlers / `import`).
  await esbuild.build({ ...COMMON, format: 'esm', outfile: path.join(outdir, 'trpicker.mjs') });

  // CommonJS bundle (legacy tooling / `require`).
  await esbuild.build({
    ...COMMON,
    format: 'cjs',
    outfile: path.join(outdir, 'trpicker.js'),
    footer: { js: CJS_FOOTER },
  });

  // IIFE bundle (direct `<script>` / CDN usage), global `trPicker`.
  await esbuild.build({
    ...COMMON,
    format: 'iife',
    outfile: path.join(outdir, 'trpicker.iife.js'),
    globalName: 'trPicker',
    footer: { js: IIFE_FOOTER },
  });

  // Copy the TypeScript declarations alongside the bundles.
  fs.copyFileSync(dtsSource, path.join(outdir, 'trpicker.d.ts'));

  const files = ['trpicker.mjs', 'trpicker.js', 'trpicker.iife.js', 'trpicker.d.ts'];
  const sizes = files
    .map((f) => `  ${f}  ${(fs.statSync(path.join(outdir, f)).size / 1024).toFixed(1)} KiB`)
    .join('\n');
  console.log(`build v${pkg.version} OK\n${sizes}`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});

