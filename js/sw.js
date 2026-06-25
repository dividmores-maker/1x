// ==========================================================
// sw.js - Service Worker للإشعارات
// حطه في الـ root folder (جنب index.html)
// ==========================================================

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title   = data.title   || 'دوري التسلية 🏆';
  const options = {
    body:    data.body    || 'في جديد في الدوري!',
    icon:    data.icon    || '/images/football.webp',
    badge:   '/images/football.webp',
    dir:     'rtl',
    lang:    'ar',
    vibrate: [200, 100, 200],
    data:    { url: data.url || '/dashboard.html' },
    actions: [
      { action: 'open',    title: 'افتح الآن' },
      { action: 'dismiss', title: 'تجاهل'     },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/dashboard.html';
  event.waitUntil(clients.openWindow(url));
});

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
