const CACHE_NAME = 'time-savor-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/pwa-icon-144.png',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  // Handle API requests differently
  if (event.request.url.includes('/rest/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before using it
          const clonedResponse = response.clone();
          
          // Open cache and store API response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
  } else {
    // For non-API requests, try cache first
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-habits') {
    event.waitUntil(syncHabits());
  }
});

// Function to sync habits with the server
async function syncHabits() {
  try {
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      switch (action.type) {
        case 'add':
          await syncAddHabit(action.data);
          break;
        case 'update':
          await syncUpdateHabit(action.data);
          break;
        case 'delete':
          await syncDeleteHabit(action.data);
          break;
      }
    }
    
    // Clear pending actions after successful sync
    await clearPendingActions();
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
