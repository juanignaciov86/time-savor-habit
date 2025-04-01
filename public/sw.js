const CACHE_NAME = 'time-savor-v1';
const isDev = location.hostname === 'localhost';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/pwa-icon-144.png',
  '/logo192.png',
  '/logo512.png',
  '/assets/*',  // Cache all assets
  '/images/*'   // Cache all images
];

// Development assets to cache
const DEV_ASSETS = [
  '/@vite/client',
  '/src/main.tsx',
  '/node_modules/.vite/deps/react.js',
  '/node_modules/.vite/deps/react-dom.js'
];

// Cache bust helper
const cacheBust = (request) => {
  const url = new URL(request.url);
  url.searchParams.set('cache-bust', Date.now().toString());
  return new Request(url.toString(), request);
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const assetsToCache = [...STATIC_ASSETS];

      // Add dev assets in development mode
      if (isDev) {
        assetsToCache.push(...DEV_ASSETS);
      } else {
        // In production, cache build assets
        try {
          const response = await fetch('/asset-manifest.json');
          const manifest = await response.json();
          const buildAssets = Object.values(manifest.files || {});
          assetsToCache.push(...buildAssets);
        } catch (error) {
          console.log('Could not cache build assets:', error);
        }
      }

      // Cache all assets
      for (const asset of assetsToCache) {
        try {
          if (asset.endsWith('*')) {
            // Skip wildcard entries
            continue;
          }
          await cache.add(asset);
        } catch (error) {
          console.log(`Failed to cache asset ${asset}:`, error);
        }
      }
    })
  );

  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Take control of all clients
      clients.claim()
    ])
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and websocket connections
  if (event.request.method !== 'GET' || 
      event.request.headers.get('upgrade') === 'websocket') {
    return;
  }

  // Parse the URL
  const url = new URL(event.request.url);

  // Skip Vite HMR in development
  if (isDev && (url.pathname.includes('/@vite/client') || 
                url.pathname.includes('hmr'))) {
    return;
  }

  // Handle different types of requests
  if (url.pathname.includes('/auth/v1/user') || 
      url.pathname.includes('/rest/v1/')) {
    // Handle API requests
    event.respondWith(handleApiRequest(event.request));
  } else if (url.pathname.includes('/assets/') || 
             url.pathname.includes('/images/') ||
             url.pathname.match(/\.(png|jpe?g|gif|svg|ico)$/)) {
    // Handle static assets - cache first
    event.respondWith(handleAssetRequest(event.request));
  } else if (event.request.mode === 'navigate' || 
             url.pathname === '/' || 
             url.pathname.endsWith('.html')) {
    // Handle navigation requests - network first with fallback
    event.respondWith(handleNavigationRequest(event.request));
  } else {
    // Handle all other requests - network first with cache fallback
    event.respondWith(handleDefaultRequest(event.request));
  }
});

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.log('API request failed:', request.url, error);
    const cachedResponse = await caches.match(request);
    
    // Special handling for auth requests
    if (request.url.includes('/auth/v1/user')) {
      const habits = JSON.parse(localStorage.getItem('time-savor-habits') || '[]');
      if (habits.length > 0) {
        return new Response(JSON.stringify({
          data: { user: { id: 'offline-user' } },
          error: null
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // For habit-related endpoints, return cached data
    if (request.url.includes('/rest/v1/habits')) {
      const habits = JSON.parse(localStorage.getItem('time-savor-habits') || '[]');
      return new Response(JSON.stringify({
        data: habits,
        error: null
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return cached response if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline error response
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'You are currently offline. Please try again when online.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static asset requests
async function handleAssetRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('Using cached asset:', request.url);
    return cachedResponse;
  }

  try {
    // If not in cache, try network
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.log('Asset fetch failed:', request.url, error);
    
    // For images, try to return a placeholder
    if (request.url.match(/\.(png|jpe?g|gif|svg|ico)$/)) {
      const placeholder = await caches.match('/logo.svg');
      if (placeholder) {
        console.log('Using placeholder for failed image:', request.url);
        return placeholder;
      }
    }
    
    throw error;
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Check if offline
    if (!navigator.onLine) {
      // Try exact match from cache first
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('Using cached navigation response (offline)');
        return cachedResponse;
      }
    }
    
    // Try network
    try {
      const response = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      console.log('Navigation fetch failed:', error);
      
      // Try exact match from cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('Using cached navigation response');
        return cachedResponse;
      }
      
      // Try root as fallback
      const rootResponse = await caches.match('/');
      if (rootResponse) {
        console.log('Using root as fallback');
        return rootResponse;
      }
      
      // Try index.html as last resort
      const indexResponse = await caches.match('/index.html');
      if (indexResponse) {
        console.log('Using index.html as fallback');
        return indexResponse;
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Navigation handler failed:', error);
    // Return a basic offline page
    return new Response(
      '<html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle all other requests
async function handleDefaultRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return caches.match(request);
  }
}

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
    
    if (pendingActions.length === 0) {
      console.log('No pending actions to sync');
      return;
    }

    console.log('Syncing pending actions:', pendingActions.length);
    
    for (const action of pendingActions) {
      try {
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
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        // Keep failing action in pending queue
        continue;
      }
    }
    
    // Clear successfully synced actions
    await clearPendingActions();
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function syncAddHabit(habit) {
  const response = await fetch('/api/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify(habit)
  });

  if (!response.ok) {
    throw new Error(`Failed to sync habit: ${response.statusText}`);
  }

  return response.json();
}

async function syncUpdateHabit(habit) {
  const response = await fetch(`/api/habits/${habit.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify(habit)
  });

  if (!response.ok) {
    throw new Error(`Failed to update habit: ${response.statusText}`);
  }

  return response.json();
}

async function syncDeleteHabit(habit) {
  const response = await fetch(`/api/habits/${habit.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${await getAuthToken()}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete habit: ${response.statusText}`);
  }
}

async function getAuthToken() {
  const authData = localStorage.getItem('sb-auth-token');
  return authData ? JSON.parse(authData).access_token : null;
}

// Helper function to get pending actions from localStorage
function getPendingActions() {
  const stored = localStorage.getItem('pendingActions');
  return stored ? JSON.parse(stored) : [];
}

// Helper function to clear pending actions from localStorage
function clearPendingActions() {
  localStorage.removeItem('pendingActions');
}
