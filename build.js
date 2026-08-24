/**
 * trPicker build script
 * =====================
 * Merges all JS files into a single file (stripping the entry's auto-load logic).
 *
 * Usage: node build.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, 'src');
const DST = path.resolve(__dirname, 'dist');

// ==================== JS merge order ====================
const LIB_ORDER = [
    'trpicker-config.js',
    'trpicker-utils.js',
    'trpicker-svg.js',
    'trpicker-zoom.js',
    'trpicker-view.js',
    'trpicker-events.js',
    'trpicker-popup.js',
    'trpicker-fine-slider.js',
];

// Auto-load marker — everything from this line onwards is stripped
const AUTO_LOAD_MARKER = '// ==================== Auto-loading dependency modules ====================';

/**
 * Read the entry file and strip the auto-load section.
 */
function readEntry() {
    const content = fs.readFileSync(path.join(SRC, 'trpicker.js'), 'utf8');
    const idx = content.indexOf(AUTO_LOAD_MARKER);
    if (idx === -1) {
        console.error('Warning: auto-load marker not found; keeping the full file');
        return content;
    }
    return content.substring(0, idx).replace(/\n{3,}$/, '\n');
}

/**
 * Read the dependency modules (kept as-is; IIFE-wrapped code merges without conflicts).
 */
function readLibs() {
    const chunks = [];
    LIB_ORDER.forEach((file) => {
        const filePath = path.join(SRC, file);
        if (!fs.existsSync(filePath)) {
            console.error('Error: dependency file not found ' + filePath);
            process.exit(1);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        chunks.push(content);
    });
    return chunks.join('\n\n');
}

/**
 * Ensure a directory exists.
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// ==================== Build ====================
console.log('Building trPicker ...');

// Clean dist
if (fs.existsSync(DST)) {
    fs.rmSync(DST, { recursive: true });
}

// 1. Merge JS
const entry = readEntry();
const libs  = readLibs();
const combined = entry + '\n\n' + libs;

ensureDir(DST);
fs.writeFileSync(path.join(DST, 'trpicker.js'), combined, 'utf8');
console.log('  ✓ dist/trpicker.js (' + (1 + LIB_ORDER.length) + ' files merged)');

// 2. Summary
const stats = fs.statSync(path.join(DST, 'trpicker.js'));
console.log('');
console.log('Build complete!');
console.log('  dist/trpicker.js  — ' + (stats.size / 1024).toFixed(1) + ' KB');
console.log('');
console.log('Usage: <script src="dist/trpicker.js"></script> or via CDN');
