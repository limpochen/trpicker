/**
 * trPicker 构建脚本
 * =================
 * 合并所有 JS 文件为一个文件（去掉入口中的自动加载逻辑）。
 *
 * 用法：node build.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, 'src');
const DST = path.resolve(__dirname, 'dist');

// ==================== JS 合并顺序 ====================
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

// 自动加载标记行 — 从此行开始往后全部删掉
const AUTO_LOAD_MARKER = '// ==================== Auto-loading dependency modules ====================';

/**
 * 读取入口文件并去掉自动加载部分。
 */
function readEntry() {
    const content = fs.readFileSync(path.join(SRC, 'trpicker.js'), 'utf8');
    const idx = content.indexOf(AUTO_LOAD_MARKER);
    if (idx === -1) {
        console.error('警告：未找到自动加载标记，将保留完整文件');
        return content;
    }
    return content.substring(0, idx).replace(/\n{3,}$/, '\n');
}

/**
 * 读取依赖模块（保持原样，IIFE 包裹的代码合并后无冲突）。
 */
function readLibs() {
    const chunks = [];
    LIB_ORDER.forEach((file) => {
        const filePath = path.join(SRC, file);
        if (!fs.existsSync(filePath)) {
            console.error('错误：依赖文件不存在 ' + filePath);
            process.exit(1);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        chunks.push(content);
    });
    return chunks.join('\n\n');
}

/**
 * 确保目录存在。
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// ==================== 开始构建 ====================
console.log('构建 trPicker ...');

// 清理 dist
if (fs.existsSync(DST)) {
    fs.rmSync(DST, { recursive: true });
}

// 1. 合并 JS
const entry = readEntry();
const libs  = readLibs();
const combined = entry + '\n\n' + libs;

ensureDir(DST);
fs.writeFileSync(path.join(DST, 'trpicker.js'), combined, 'utf8');
console.log('  ✓ dist/trpicker.js (合并 ' + (1 + LIB_ORDER.length) + ' 个文件)');

// 2. 总览
const stats = fs.statSync(path.join(DST, 'trpicker.js'));
console.log('');
console.log('构建完成！');
console.log('  dist/trpicker.js  — ' + (stats.size / 1024).toFixed(1) + ' KB');
console.log('');
console.log('用法：<script src="dist/trpicker.js"></script> 或通过 CDN 引入');
