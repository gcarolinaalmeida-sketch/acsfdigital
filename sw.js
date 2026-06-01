const CACHE_NAME = 'acs-digital-v5';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './familias.html',
  './familias_lista.html',
  './familia_detalhe.html',
  './cidadaos_lista.html',
  './visitas.html',
  './visitas_lista.html',
  './pendencias.html',
  './relatorios.html',
  './metas.html',
  './agenda.html',
  './percurso.html',
  './mapa.html',
  './configuracoes.html',
  './importador.html',
  './vacinacao.html',
  './bolsa_familia.html',
  './saude_cidadao.html',
  './pin.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// ── INSTALL: cache um por um, não falha se um arquivo não existir ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        FILES_TO_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Não conseguiu cachear:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: remove caches antigos ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Cache first para arquivos locais, Network first para externos ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições não-GET e chrome-extension
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Para arquivos externos (CDN, APIs), tenta rede e ignora erro
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 408 }))
    );
    return;
  }

  // Para arquivos locais: Cache first, atualiza em background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Busca atualização em background (stale-while-revalidate)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => null);

      // Retorna cache imediatamente se existir, senão aguarda rede
      return cachedResponse || fetchPromise;
    })
  );
});
