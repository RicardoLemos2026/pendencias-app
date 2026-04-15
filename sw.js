// sw.js — Service Worker para PWA Pendências
// Versão: atualizar este número força o Safari a recarregar o app no Dock
var CACHE_NAME = 'pendencias-v9';

self.addEventListener('install', function(e) {
  // Ativa imediatamente sem esperar aba anterior fechar
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Remove caches antigos de versões anteriores
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // Estratégia: Network First para o index.html (sempre busca versão atualizada)
  // Fallback para cache apenas se offline
  if (e.request.mode === 'navigate' || e.request.url.endsWith('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  } else {
    // Outros assets: cache first
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          return res;
        });
      })
    );
  }
});
