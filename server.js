const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const root = path.join(__dirname, 'public');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function getPathFromRequest(url = '/') {
  let pathname = '/';

  try {
    pathname = new URL(url, 'http://localhost').pathname;
  } catch {
    pathname = '/';
  }

  try {
    return decodeURIComponent(pathname);
  } catch {
    return '/';
  }
}

function send(res, status, headers, body, method = 'GET') {
  res.writeHead(status, headers);
  res.end(method === 'HEAD' ? undefined : body);
}

function serveFile(req, res) {
  const method = req.method || 'GET';

  if (method !== 'GET' && method !== 'HEAD') {
    send(res, 405, {
      'Allow': 'GET, HEAD',
      'Content-Type': 'text/plain; charset=utf-8'
    }, 'Method not allowed', method);
    return;
  }

  const requestUrl = getPathFromRequest(req.url);
  const requestPath = requestUrl === '/' ? '/index.html' : requestUrl;
  const filePath = path.resolve(root, `.${requestPath}`);
  const safeRoot = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (!filePath.startsWith(safeRoot)) {
    send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden', method);
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      const hasExtension = Boolean(path.extname(filePath));
      if (!hasExtension) {
        const fallbackPath = path.join(root, 'index.html');
        fs.readFile(fallbackPath, (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found', method);
            return;
          }
          send(res, 200, { 'Content-Type': types['.html'] }, fallbackData, method);
        });
        return;
      }

      send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found', method);
      return;
    }

    send(res, 200, {
      'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    }, data, method);
  });
}

module.exports = serveFile;

if (require.main === module) {
  http.createServer(serveFile).listen(port, () => {
    console.log(`SeatSight running at http://localhost:${port}`);
  });
}
