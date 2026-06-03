// VisualCSS Service Worker v2
// Sirve archivos del proyecto con resolución correcta de rutas relativas
// Funciona igual que python -m http.server

const FILES = new Map();
let SCOPE_PATH = '/visualcss/'; // set on first fetch, derived from scope

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', e => {
  const d = e.data;
  if (!d) return;

  if (d.type === 'SET_FILES') {
    FILES.clear();
    for (const [k, v] of Object.entries(d.files)) {
      FILES.set(normPath(k), v);
    }
    if (e.source) e.source.postMessage({ type: 'SW_READY', count: FILES.size });
  }

  if (d.type === 'UPDATE_FILE') {
    FILES.set(normPath(d.path), { content: d.content, mime: d.mime });
  }

  if (d.type === 'CLEAR') FILES.clear();
  if (d.type === 'PING' && e.source) e.source.postMessage({ type: 'PONG' });
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Derive scope path from registration
  const scope = new URL(self.registration.scope);
  const scopePath = scope.pathname; // e.g. /repo/visualcss/

  if (!url.pathname.startsWith(scopePath)) return;

  e.respondWith(handleRequest(url, scopePath));
});

async function handleRequest(url, scopePath) {
  // Strip scope prefix to get project-relative path
  // /repo/visualcss/blackjack/index.html → blackjack/index.html
  let reqPath = url.pathname.slice(scopePath.length);
  reqPath = reqPath.split('?')[0]; // remove query string
  reqPath = normPath(reqPath);

  if (!reqPath || reqPath.endsWith('/')) reqPath += 'index.html';

  // 1. Exact match
  if (FILES.has(reqPath)) return respond(FILES.get(reqPath));

  // 2. Match without first path segment
  const withoutFirst = reqPath.includes('/') ? reqPath.slice(reqPath.indexOf('/') + 1) : '';
  if (withoutFirst && FILES.has(withoutFirst)) return respond(FILES.get(withoutFirst));

  // 3. Match by filename + best suffix overlap
  const filename = reqPath.split('/').pop();
  if (filename) {
    const candidates = [];
    for (const [k] of FILES) {
      if (k === filename || k.endsWith('/' + filename)) candidates.push(k);
    }
    if (candidates.length === 1) return respond(FILES.get(candidates[0]));
    if (candidates.length > 1) {
      const best = candidates.reduce((b, k) => {
        const score = commonSuffixLen(reqPath, k);
        return score > b.score ? { k, score } : b;
      }, { k: candidates[0], score: -1 });
      return respond(FILES.get(best.k));
    }
  }

  // 4. Suffix match
  for (const [k, v] of FILES) {
    if (reqPath.endsWith(k) || k.endsWith(reqPath)) return respond(v);
  }

  const sample = [...FILES.keys()].slice(0, 8).join('\n  ');
  return new Response(
    `404: ${reqPath}\nScope: ${scopePath}\nFiles (sample):\n  ${sample}`,
    { status: 404, headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' } }
  );
}

function respond(f) {
  return new Response(f.content, {
    status: 200,
    headers: {
      'Content-Type': f.mime || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    }
  });
}

function normPath(p) {
  if (!p) return '';
  const parts = p.replace(/\\/g, '/').split('/');
  const out = [];
  for (const part of parts) {
    if (part === '..') { if (out.length > 0) out.pop(); }
    else if (part && part !== '.') out.push(part);
  }
  return out.join('/');
}

function commonSuffixLen(a, b) {
  const pa = a.split('/').reverse();
  const pb = b.split('/').reverse();
  let n = 0;
  while (n < pa.length && n < pb.length && pa[n] === pb[n]) n++;
  return n;
}
