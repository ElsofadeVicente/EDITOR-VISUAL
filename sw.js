// VisualCSS Service Worker
const FILES = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', e => {
  const d = e.data; if (!d) return;
  if (d.type === 'SET_FILES') {
    FILES.clear();
    for (const [k, v] of Object.entries(d.files)) FILES.set(k, v);
    e.source?.postMessage({ type: 'SW_READY', count: FILES.size });
  }
  if (d.type === 'UPDATE_FILE') FILES.set(d.path, { content: d.content, mime: d.mime });
  if (d.type === 'CLEAR') FILES.clear();
  if (d.type === 'PING') e.source?.postMessage({ type: 'PONG' });
  // Debug: devolver lista de keys
  if (d.type === 'LIST_FILES') {
    e.source?.postMessage({ type: 'FILE_LIST', total: FILES.size, keys: [...FILES.keys()].slice(0, 30) });
  }
});

self.addEventListener('fetch', e => {
  // Siempre responder si tenemos el archivo — nunca dejar pasar a GitHub Pages
  const url = new URL(e.request.url);

  // Ignorar peticiones a otros orígenes (Firebase, Google Fonts, CDNs)
  if (url.origin !== self.location.origin) return;

  const scope = self.registration.scope;
  const scopePath = new URL(scope).pathname; // "/EDITOR-VISUAL/"

  // Solo interceptar URLs bajo nuestro scope
  if (!url.pathname.startsWith(scopePath)) return;

  // Extraer path relativo al scope, sin query string
  const reqPath = normPath(url.pathname.slice(scopePath.length)).split('?')[0];

  // No interceptar la raíz del editor (index.html, sw.js)
  if (!reqPath || reqPath === 'index.html' || reqPath === 'sw.js') return;

  // Buscar en FILES — si no está, responder 404 nosotros (no GitHub Pages)
  const entry = findFile(reqPath);

  e.respondWith(entry
    ? new Response(entry.content, {
        status: 200,
        headers: {
          'Content-Type': entry.mime || 'application/octet-stream',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        }
      })
    : new Response(
        `SW 404: "${reqPath}"\nFiles loaded: ${FILES.size}\nSample keys:\n` +
        [...FILES.keys()].slice(0,10).join('\n'),
        { status: 404, headers: { 'Content-Type': 'text/plain' } }
      )
  );
});

function findFile(reqPath) {
  // 1. Match exacto
  if (FILES.has(reqPath)) return FILES.get(reqPath);

  // 2. Limpiar query string
  const clean = reqPath.split('?')[0];
  if (FILES.has(clean)) return FILES.get(clean);

  // 3. El iframe está bajo visualcss/X/ y pide ../../Y/Z
  //    El navegador resuelve las .. antes de hacer la petición
  //    Resultado: req="js/shared.js" pero key="visualcss/js/shared.js"
  //    → intentar con prefijo visualcss/
  const prefixed = 'visualcss/' + clean;
  if (FILES.has(prefixed)) return FILES.get(prefixed);

  // 4. Buscar por mejor coincidencia de sufijo
  const filename = clean.split('/').pop();
  if (!filename) return null;

  let best = null, bestScore = -1;
  for (const [k, v] of FILES) {
    if (!k.endsWith('/' + filename) && k !== filename) continue;
    const score = suffixScore(clean, k);
    if (score > bestScore) { bestScore = score; best = v; }
  }
  return best;
}

function normPath(p) {
  const parts = (p || '').split('/'), out = [];
  for (const s of parts) {
    if (s === '..') { if (out.length) out.pop(); }
    else if (s && s !== '.') out.push(s);
  }
  return out.join('/');
}

function suffixScore(req, key) {
  const rp = req.split('/').reverse(), kp = key.split('/').reverse();
  let n = 0;
  while (n < rp.length && n < kp.length && rp[n] === kp[n]) n++;
  return n;
}
