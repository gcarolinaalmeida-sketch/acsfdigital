const CACHE_NAME = 'acs-digital-v3';

// Lista completa de ficheiros para funcionar offline
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
  './comprovantes.html',
  './relatorios.html',
  './relatorios_mensal.html',
  './metas.html',
  './agenda.html',
  './calendario.html',
  './percurso.html',
  './mapa.html',
  './configuracoes.html',
  './importador.html',
  './notificacoes.html',
  './vacinacao.html',
  './saude_cidadao.html',
  './pin.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://cdn-icons-png.flaticon.com/512/2966/2966327.png'
];

// Instala e faz cache de todos os ficheiros
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativa e limpa versões antigas
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

// Estratégia: Network first, fallback para cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Atualiza o cache com a versão mais recente
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Sem internet: usa o cache
        return caches.match(event.request);
      })
  );
});
