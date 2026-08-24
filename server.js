/**
 * trPicker development server
 * ===========================
 * A dependency-free static file server built on plain Node.js.
 *
 * Usage:
 *   node server.js           # default port 8080
 *   node server.js 3000      # specify a port
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
    // Handle GET / HEAD only
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        return res.end();
    }

    let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);

    // Default entry
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(ROOT, urlPath);

    // Prevent path traversal
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
    console.log(`trPicker dev server started:`);
    console.log(`  Local:   http://localhost:${PORT}/`);
    console.log(`  Quit:    press Ctrl+C to stop`);
});
