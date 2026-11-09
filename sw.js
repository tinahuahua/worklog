// Offline support: keeps a copy of the page and its libraries so the site opens without internet.
// Records themselves live in localStorage + Supabase; Supabase requests are never cached here.
const CACHE = 'worklog-v17';
const PRECACHE = [
  './',
  './manifest.webmanifest',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

function put(req, res) {
  if (res.ok || res.type === 'opaque') {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;   // live data: always go to the network

  if (req.mode === 'navigate' || url.origin === location.origin) {
    // network first so site updates show up right away; cached copy when offline
    e.respondWith(
      fetch(req).then(res => put(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./')))
    );
    return;
  }

  // CDN library and fonts: cache first
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => put(req, res))));
});
