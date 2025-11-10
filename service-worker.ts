import join from 'url-join';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
    INJECT_MANIFEST_PLUGIN: Array<{
        url: string;
        revision: string;
    }>;
};

clientsClaim();

precacheAndRoute(self.INJECT_MANIFEST_PLUGIN);

const fileExtensionRegexp = /\/[^/?]+\.[^/]+$/;

registerRoute(
    ({ request, url }) => {
        if (request.mode !== 'navigate') {
            return false;
        }
        if (url.pathname.startsWith('/_')) {
            return false;
        }
        if (fileExtensionRegexp.exec(url.pathname)) {
            return false;
        }
        return true;
    },
    createHandlerBoundToURL(join('/', 'index.html'))
);

registerRoute(
    /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 4,
                maxAgeSeconds: 365 * 24 * 60 * 60
            })
        ]
    })
);

registerRoute(
    ({ url }) => url.origin === globalThis.location.origin && /\.(?:png|jpg|jpeg|svg|gif|webp)$/.test(url.pathname),
    new CacheFirst({
        cacheName: 'images',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60
            })
        ]
    })
);

registerRoute(
    ({ request }) => request.destination === 'document',
    new NetworkFirst({
        cacheName: 'pages',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60
            })
        ]
    })
);
