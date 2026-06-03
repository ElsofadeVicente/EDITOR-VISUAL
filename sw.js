// VisualCSS Service Worker
// Scope: /EDITOR-VISUAL/ (mismo directorio que el editor en GitHub Pages)
// Sirve archivos del proyecto desde memoria

const FILES = new Map(); // path → {content, mime}

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
});

self.addEventListener('fetch', e => {
  if (FILES.size === 0) return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // ignorar CDNs, Firebase, etc.

  // Extraer path relativo al scope del SW
  // scope = "https://user.github.io/EDITOR-VISUAL/"
  // url   = "https://user.github.io/EDITOR-VISUAL/visualcss/blackjack/index.html"
  // → path = "visualcss/blackjack/index.html"
  const scope = self.registration.scope;
  const scopePath = new URL(scope).pathname; // "/EDITOR-VISUAL/"
  const reqPathFull = url.pathname; // "/EDITOR-VISUAL/visualcss/blackjack/index.html"

  if (!reqPathFull.startsWith(scopePath)) return;

  const reqPath = normPath(reqPathFull.slice(scopePath.length));

  // Solo responder si tenemos este archivo
  const entry = findFile(reqPath);
  if (!entry) return; // dejar al navegador si no lo tenemos

  e.respondWith(new Response(entry.content, {
    status: 200,
    headers: {
      'Content-Type': entry.mime || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    }
  }));
});

function findFile(reqPath) {
  // 1. Match exacto
  if (FILES.has(reqPath)) return FILES.get(reqPath);

  // 2. reqPath puede tener query string residual — limpiar
  const clean = reqPath.split('?')[0];
  if (clean !== reqPath && FILES.has(clean)) return FILES.get(clean);

  // 3. Buscar por sufijo: req="visualcss/js/shared.js", key="visualcss/js/shared.js" ✓
  //    Pero también: req="EDITOR-VISUAL/js/shared.js" cuando el navegador resuelve ../../
  //    En ese caso el path ya fue recortado al scope, así que debería cuadrar
  for (const [k, v] of FILES) {
    if (k === clean) return v;
  }

  // 4. El iframe puede pedir rutas que suben niveles resueltas por el navegador
  //    ej: iframe está en visualcss/blackjack/ y pide ../../js/shared.js
  //    el navegador resuelve a /EDITOR-VISUAL/js/shared.js → reqPath = "js/shared.js"
  //    en FILES está como "visualcss/js/shared.js"
  //    → intentar con prefijo "visualcss/"
  const withPrefix = 'visualcss/' + clean;
  if (FILES.has(withPrefix)) return FILES.get(withPrefix);

  // 5. Buscar por nombre de archivo con mejor coincidencia de sufijo
  const filename = clean.split('/').pop();
  if (!filename) return null;

  let best = null, bestScore = -1;
  for (const [k, v] of FILES) {
    const kFile = k.split('/').pop();
    if (kFile !== filename) continue;
    const score = suffixScore(clean, k);
    if (score > bestScore) { bestScore = score; best = v; }
  }
  return best;
}

function normPath(p) {
  if (!p) return '';
  const parts = p.split('/');
  const out = [];
  for (const seg of parts) {
    if (seg === '..') { if (out.length) out.pop(); }
    else if (seg && seg !== '.') out.push(seg);
  }
  return out.join('/');
}

function suffixScore(req, key) {
  const rp = req.split('/').reverse();
  const kp = key.split('/').reverse();
  let n = 0;
  while (n < rp.length && n < kp.length && rp[n] === kp[n]) n++;
  return n;
}
