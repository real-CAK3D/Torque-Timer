self.addEventListener('install',e=>e.waitUntil(caches.open('torqueclock-v10').then(c=>c.addAll(['/','/index.html','/style.css','/app.js','/manifest.webmanifest','/icon.svg']))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!=='torqueclock-v10').map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.url.includes('/api/'))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
