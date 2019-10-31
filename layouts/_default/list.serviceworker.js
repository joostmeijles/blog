const version = "{{ if $.GitInfo }} {{ .GitInfo.Hash }} {{ else }} {{ .Lastmod }} {{ end }}";
    
const pages = [
    {{ $list := .Pages -}}
    {{ $length := (len $list) -}}
    {{ range $index, $element := $list -}}
        "{{ .Permalink }}"{{ if ne (add $index 1) $length }},{{ end }}
    {{ end -}}
];

const home = "/";

self.addEventListener('install', (evt) => {
    console.log('[ServiceWorker] Install');
    
    evt.waitUntil(
        caches.open(sitemap.version).then((cache) => {
          console.log('[ServiceWorker] Pre-caching offline pages');
          console.log(sitemap.pages);
          return cache.addAll(sitemap.pages);
        })
    );

    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    console.log('[ServiceWorker] Activate');
    
    evt.waitUntil(
        caches.keys().then((keyList) => {
          return Promise.all(keyList.map((key) => {
            if (key !== sitemap.version) {
              console.log('[ServiceWorker] Removing old cache', key);
              return caches.delete(key);
            }
          }));
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
    console.log('[ServiceWorker] Fetch', evt.request.url);
    
    if (evt.request.mode !== 'navigate') {
        // Not a page navigation, bail.
        return;
    }

    evt.respondWith(
        fetch(evt.request)
            .catch(() => {
            return caches.open(sitemap.version)
                .then((cache) => {
                    // Fallback to cached index
                    return cache.match(home);
                });
            })
    );
});
