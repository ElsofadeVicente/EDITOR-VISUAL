// VisualCSS Service Worker
// Scope: / — intercepta TODAS las peticiones del iframe
// Sirve los archivos del proyecto desde memoria, igual que localhost

const FILES = new Map(); // swPath -> { content, mime }

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// ── Mensajes desde el editor principal ──
self.addEventListener('message', e => {
  const d = e.data;
  if (!d) return;

  if (d.type === 'SET_FILES') {
    FILES.clear();
    for (const [k, v] of Object.entries(d.files)) FILES.set(k, v);
    e.source?.postMessage({ type: 'SW_READY', count: FILES.size });
    return;
  }
  if (d.type === 'UPDATE_FILE') {
    FILES.set(d.path, { content: d.content, mime: d.mime });
    return;
  }
  if (d.type === 'CLEAR') { FILES.clear(); return; }
  if (d.type === 'PING')  { e.source?.postMessage({ type: 'PONG' }); return; }
});

// ── Interceptar fetch del iframe ──
self.addEventListener('fetch', e => {
  // Solo interceptar si hay archivos cargados
  if (FILES.size === 0) return;

  const url = new URL(e.request.url);

  // Ignorar peticiones externas (Google Fonts, Firebase, CDNs, etc.)
  if (url.origin !== self.location.origin) return;

  // El path de la petición, sin slash inicial: "blackjack/css/blackjack.css"
  const reqPath = normPath(url.pathname.slice(1));

  // Solo responder si tenemos el archivo
  const entry = resolve(reqPath);
  if (!entry) return; // dejar pasar al navegador si no lo tenemos

  e.respondWith(Promise.resolve(new Response(entry.content, {
    status: 200,
    headers: {
      'Content-Type': entry.mime || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    }
  })));
});

// ── Resolver un path contra FILES ──
function resolve(reqPath) {
  // 1. Match exacto
  if (FILES.has(reqPath)) return FILES.get(reqPath);

  // 2. El path puede venir con un prefijo extra que no está en FILES
  //    ej: req="project/blackjack/index.html" pero key="blackjack/index.html"
  //    Buscar la key que sea sufijo del reqPath
  for (const [k, v] of FILES) {
    if (reqPath === k) return v;
    if (reqPath.endsWith('/' + k) || reqPath === k) return v;
    // reqPath termina con la key
    if (k.length < reqPath.length && reqPath.slice(reqPath.length - k.length) === k
        && reqPath[reqPath.length - k.length - 1] === '/') return v;
  }

  // 3. La key puede tener un prefijo extra
  //    ej: req="js/shared.js" key="Version 9/js/shared.js" → ya stripeado
  //    pero por si acaso: buscar key que termine con el reqPath
  const suffix = '/' + reqPath;
  for (const [k, v] of FILES) {
    if (k.endsWith(suffix)) return v;
  }

  // 4. Match solo por filename si es único
  const filename = reqPath.split('/').pop();
  if (filename) {
    const hits = [];
    for (const [k, v] of FILES) {
      if (k === filename || k.endsWith('/' + filename)) hits.push({ k, v });
    }
    if (hits.length === 1) return hits[0].v;
    // Si hay varios con ese nombre, elegir el que comparte más segmentos de path
    if (hits.length > 1) {
      let best = hits[0];
      let bestScore = suffixScore(reqPath, hits[0].k);
      for (let i = 1; i < hits.length; i++) {
        const s = suffixScore(reqPath, hits[i].k);
        if (s > bestScore) { bestScore = s; best = hits[i]; }
      }
      return best.v;
    }
  }

  return null;
}

function normPath(p) {
  if (!p) return '';
  const parts = p.split('/');
  const out = [];
  for (const seg of parts) {
    if (seg === '..') out.pop();
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
