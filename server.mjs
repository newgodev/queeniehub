import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8' };
const safePath = (urlPath) => {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const relative = decoded.replace(/^\/+/, '');
  const candidate = path.resolve(root, relative);
  return candidate.startsWith(root) ? candidate : root;
};
const server = http.createServer((req,res) => {
  let file = safePath(req.url);
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  } catch {}
  if (!fs.existsSync(file)) file = path.join(root, 'index.html');
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain; charset=utf-8', 'Cache-Control':'no-cache' });
  fs.createReadStream(file).pipe(res);
});
const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => console.log(`QueenieHub preview listening on ${port}`));
