/**
 * trPicker 开发服务器
 * ===================
 * 纯 Node.js 静态文件服务，零外部依赖。
 *
 * 用法：
 *   node server.js           # 默认端口 8080
 *   node server.js 3000      # 指定端口
 */
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8080;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
    // 只处理 GET / HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        return res.end();
    }

    let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);

    // 默认入口
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(ROOT, urlPath);

    // 防止路径穿越
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    const ext = path.extname(filePath).toLowerCase();

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                return res.end('Not Found');
            }
            res.writeHead(500);
            return res.end('Internal Server Error');
        }

        res.writeHead(200, {
            'Content-Type':      MIME[ext] || 'application/octet-stream',
            'Content-Length':    data.length,
            'Cache-Control':     'no-cache',
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`trPicker 开发服务器已启动:`);
    console.log(`  本地:   http://localhost:${PORT}/`);
    console.log(`  退出:   按 Ctrl+C 停止`);
});
