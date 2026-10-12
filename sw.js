const CACHE_NAME = 'discipline-v' + Date.now();
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Установка новой версии...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Активация...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    // НЕ перехватываем Google, Firebase Auth и другие внешние сервисы
    if (url.includes('accounts.google.com') || 
        url.includes('firebaseapp.com') || 
        url.includes('googleapis.com') ||
        url.includes('gstatic.com')) {
        return; // пропускаем запрос напрямую
    }
    
    // Для HTML — всегда свежая версия
    if (event.request.mode === 'navigate' || url.endsWith('index.html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
