const CACHE_NAME = 'acs-digital-v4';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './familias.html',
  './familias_lista.html',
  './familias_detalhe.html',
  './visitas.html',
  './visitas_lista.html',
  './pendencias.html',
  './relatorios.html',
  './relatorios_mensal.html',
  './metas.html',
  './agenda.html',
  './percurso.html',
  './mapa.html',
  './configuracoes.html',
  './importador.html',
  './notificacoes.html',
  './vacinacao.html',
  './pin.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
