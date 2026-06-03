// VisualCSS Service Worker
// Sirve los archivos del proyecto como un servidor HTTP real
const FILES = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', e => {
  const d = e.data;
  if (!d) return;
  if (d.type === 'SET_FILES') {
    FILES.clear();
    for (const [k, v] of Object.entries(d.files)) FILES.set(k, v);
    if (e.source) e.source.postMessage({ type: 'SW_READY', count: FILES.size });
  }
  if (d.type === 'UPDATE_FILE') {
    FILES.set(d.path, { content: d.content, mime: d.mime });
  }
  if (d.type === 'CLEAR') FILES.clear();
  if (d.type === 'PING') {
    if (e.source) e.source.postMessage({ type: 'PONG' });
  }
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (!url.pathname.startsWith('/visualcss/')) return;

  e.respondWith((async () => {
    let path = url.pathname.replace('/visualcss/', '');
    if (!path || path.endsWith('/')) path += 'index.html';

    // Exact match
    if (FILES.has(path)) return respond(FILES.get(path));

    // Query string stripped match (e.g. path?__ve_edit__=123)
    for (const [k, v] of FILES) {
      if (k === path || k.endsWith('/' + path)) return respond(v);
    }

    // Fuzzy: last segment match
    const seg = path.split('/').pop();
    for (const [k, v] of FILES) {
      if (k.endsWith('/' + seg) || k === seg) return respond(v);
    }

    return new Response('404: ' + path, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  })());
});

function respond(f) {
  return new Response(f.content, {
    status: 200,
    headers: {
      'Content-Type': f.mime || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
