// Service Worker mínimo — placeholder para registro sin errores
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

