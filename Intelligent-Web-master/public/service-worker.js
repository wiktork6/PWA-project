
var dataCacheName = 'misc-v1';
var cacheName = 'assignmentPWA-1';
var filesToCache = [
    '/',
    '/scripts/app.js',
    '/scripts/database.js',
    '/styles/inline.css',
    '/styles/bootstrap.min.css',
    '/scripts/bootstrap.min.js',
    '/scripts/idb.js',
    '/scripts/jquery.min.js',
    '/fonts/glyphicons-halflings-regular.woff2',
    '/fonts/glyphicons-halflings-regular.woff',
    '/fonts/glyphicons-halflings-regular.ttf',
];


/**
 * installation event: it adds all the files to be cached
 */
self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache);
        })
    );
});


/**
 * activation of service worker: it removes all cashed files if necessary
 */
self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName && key !== dataCacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

const URLS_CACHE_THEN_NETWORK = {
    story: '/stories',        //GET, POST
    stories: '/stories/getByParams',    //POST
    reaction: '/reactions',        //POST, PUT
    user: '/users',           // GET, POST, PUT
    weather_data: '/weather_data'
};


const TO_REFESH = {
    app:     '/scripts/app.js',
    db: '/scripts/database.js'
}

/**
 * 1. for GET'ing stories, use 'cache then network'.
 *  1.1 URL: /story :: GET. Note: fetches reactions as well. Backend - request.data has to have StoryId
 *  1.2 URL: /stories :: GET. Note: fetches reactions as well.
 *      Backend - request.type has to be user stories || recommended stories || filter stories
 * 2. for POST'ing stories, use 'generic fallback': try network, if unavailable, fallback to cache and notify.
 *  2.1 URL: /story :: POST.
 * 3. for reactions, use 'cache then network'.
 * Display cached reactions -> fetch new ones in the meantime -> update DOM with new (if any)
 *  3.1. URL: /react :: POST.
 *  3.2. URL: /react :: PUT. Change reaction
 * 4. for users, use 'cache then network'
 *  4.1 URL: /user :: POST. new user
 *  4.2 URl: /user :: GET. browsing other's profile. Backend - request.data has to have userId
 *  4.3 URL: /user :: PUT. update user details.
 * 5. for static files, use 'cache, fallback to network'.
 *
 * nice to have: background sync for GET'ing stories. For now, have 'refresh' button.
 * nice to have: background sync for POST'ing a story offline.
 * nice to have: background sync for PUT'ing (Updating) user profile offline.
 * https://blog.formpl.us/how-to-handle-post-put-requests-in-offline-applications-using-service-workers-indexedb-and-da7d0798a9ab
 *
 */
self.addEventListener('fetch', function(event){
    const request_url = event.request.url;
    console.log('[SW] fetch: ' + request_url);

    //1. cache then network: story, stories, user, reaction.
    if(urlExists(request_url)){
        console.log("[SW] cache then network");

        event.respondWith(
           //TODO: caches or IndexedDB here?
           caches.open('mysite-dynamic').then(function(cache) {
               return fetch(event.request).then(function(response) {
                   cache.put(event.request, response.clone());
                   return response;
               });
           })
       )
    }
    //5. cache, fallback to network: static files

    else{
        //TODO: Remove if when in production!!!
        //always refreshes app.js and database.js
        if(urlExists(request_url, TO_REFESH)){
            console.log("[SW] forced refresh:" + request_url);
            event.respondWith(
                caches.open('mysite-dynamic').then(function(cache) {
                    return fetch(event.request).then(function(response) {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
            );
        }
        else{
            console.log("[SW] cache, fallback to network");
            event.respondWith(
                caches.match(event.request).then(function(response){
                    return response || fetch(event.request);
                })
            );
        }

    }

});



function urlExists(request_url, url_list = URLS_CACHE_THEN_NETWORK){
    for(url in url_list){
        if(request_url.indexOf(url_list[url]) > -1){
            return true;
        }
    }
    return false;
}

