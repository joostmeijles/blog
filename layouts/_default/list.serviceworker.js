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
    evt.waitUntil(
        caches.open(version).then((cache) => {
          return cache.addAll(pages);
        })
    );

    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    evt.waitUntil(
        caches.keys().then((keyList) => {
          return Promise.all(keyList.map((key) => {
            if (key !== version) {
              return caches.delete(key);
            }
          }));
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
    if (evt.request.mode !== 'navigate') {
        // Not a page navigation, bail.
        return;
    }

    evt.respondWith(
        fetch(evt.request)
            .catch(() => {
            return caches.open(version)
                .then((cache) => {
                    // Fallback to cached index
                    return cache.match(home);
                });
            })
    );
});
