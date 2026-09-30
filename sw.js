// SW v85 - Red-segura: nunca causa bucles de recarga.
// Estrategia: network-first para todo; cache solo como respaldo offline.
var CACHE = 'monique-v90';
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c) {
    // Rutas RELATIVAS: GitHub Pages sirve el sitio bajo /monique-afrodita/
    return c.addAll(['./', './manifest.json', './icon-192.png', './icon-512.png']).catch(function(){});
  }));
});
self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; })
      .map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  // Solo manejar requests dentro del scope del sitio (evita tocar otros paths del dominio)
  if (url.pathname.indexOf(self.registration.scope.replace(self.location.origin, '')) !== 0) return;
  e.respondWith(
    fetch(e.request).then(function(resp) {
      if (resp && resp.ok) {
        var copy = resp.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copy); }).catch(function(){});
      }
      return resp;
    }).catch(function() {
      return caches.match(e.request).then(function(hit) {
        if (hit) return hit;
        // Navegación offline sin cache: devolver el index cacheado
        if (e.request.mode === 'navigate') return caches.match('./');
        return Response.error();
      });
    })
  );
});
