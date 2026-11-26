var CACHE = 'dbm-converter-v9';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon.svg', './logo2.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  var isImage = /\.(png|svg|jpg|ico)(\?|$)/i.test(url.pathname + url.search);
  // 图片/图标：网络优先，避免换图后被旧缓存卡住；离线时回退缓存
  if(isImage){
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){ return caches.match(e.request) || caches.match('./logo.png'); })
    );
    return;
  }
  // 其余资源：缓存优先
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
