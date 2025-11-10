import { defineConfig, type RsbuildPluginAPI } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { InjectManifestPlugin } from 'inject-manifest-plugin';
import { writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { join } from 'node:path';
import { pluginHtmlMinifierTerser } from 'rsbuild-plugin-html-minifier-terser';

const isDev = process.env.NODE_ENV === 'development';

const pwaManifest = {
    id: '/',
    name: 'E Roadmap',
    short_name: 'E Roadmap',
    description: 'author: domino4820',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    orientation: 'portrait',
    icons: [
        {
            src: '/static/image/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
        },
        {
            src: '/static/image/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
        }
    ],
    screenshots: [
        {
            src: '/screenshot/screenshot-desktop.png',
            sizes: '1366x768',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop View'
        },
        {
            src: '/screenshot/screenshot-mobile.jpg',
            sizes: '591x1280',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Mobile View'
        }
    ]
};

const manifestPlugin = {
    name: 'generate-manifest-plugin',
    setup(api: RsbuildPluginAPI) {
        api.onAfterBuild(() => {
            const manifestContent = JSON.stringify(pwaManifest, null, 2);
            const distPath = api.context.distPath || 'dist';
            const outputPath = join(distPath, 'manifest.webmanifest');
            writeFileSync(outputPath, manifestContent, 'utf-8');
        });
    }
};

export default defineConfig({
    plugins: [
        pluginReact(),
        manifestPlugin,
        pluginHtmlMinifierTerser({
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyCSS: true,
            minifyJS: false
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    output: {
        cleanDistPath: true,
        minify: {
            js: true,
            css: true,
            jsOptions: {
                minimizerOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true
                    }
                }
            }
        },
        filename: {
            js: '[name]-[hash].js',
            css: '[name]-[hash].css'
        },
        manifest: {
            filename: 'manifest.json',
            filter: (file) => {
                return !file.name.endsWith('.LICENSE.txt') && !file.name.endsWith('.map');
            }
        }
    },
    performance: {
        preload: {
            type: 'async-chunks',
            dedupe: true
        },
        chunkSplit: {
            strategy: 'split-by-experience'
        }
    },
    tools: {
        postcss: {
            postcssOptions: {
                plugins: [tailwindcss]
            }
        },
        rspack: {
            plugins: [
                ...(isDev
                    ? []
                    : [
                          new InjectManifestPlugin({
                              file: './service-worker.js',
                              injectionPoint: 'self.INJECT_MANIFEST_PLUGIN',
                              exclude: ['*.map', '*.LICENSE.txt', 'manifest.json'],
                              removeHash: true
                          })
                      ])
            ]
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/uploads': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    dev: {
        hmr: true
    },
    html: {
        title: 'E Roadmap',
        scriptLoading: 'defer',
        favicon: './src/assets/images/favicon/favicon.ico',
        appIcon: {
            name: 'E Roadmap',
            icons: [
                {
                    src: './src/assets/images/favicon/apple-touch-icon.png',
                    size: 180,
                    target: 'apple-touch-icon'
                },
                {
                    src: './src/assets/images/favicon/android-chrome-192x192.png',
                    size: 192,
                    target: 'web-app-manifest'
                },
                {
                    src: './src/assets/images/favicon/android-chrome-512x512.png',
                    size: 512,
                    target: 'web-app-manifest'
                }
            ]
        },
        tags: [
            {
                tag: 'script',
                children: `
                    (function() {
                        const theme = localStorage.getItem('theme');
                        if (theme === 'dark') {
                            document.documentElement.classList.add('dark');
                        }
                    })();
                `,
                append: false,
                publicPath: false
            },
            {
                tag: 'link',
                attrs: {
                    rel: 'preconnect',
                    href: 'https://fonts.googleapis.com'
                },
                append: false,
                publicPath: false
            },
            {
                tag: 'link',
                attrs: {
                    rel: 'preconnect',
                    href: 'https://fonts.gstatic.com',
                    crossorigin: 'anonymous'
                },
                append: false,
                publicPath: false
            },
            {
                tag: 'link',
                attrs: {
                    rel: 'preload',
                    as: 'style',
                    href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap'
                },
                append: false,
                publicPath: false
            },
            {
                tag: 'link',
                attrs: {
                    rel: 'manifest',
                    href: '/manifest.webmanifest'
                },
                append: false,
                publicPath: true
            },
            {
                tag: 'meta',
                attrs: {
                    name: 'theme-color',
                    content: '#ffffff'
                },
                append: false,
                publicPath: false
            },
            {
                tag: 'meta',
                attrs: {
                    name: 'mobile-web-app-capable',
                    content: 'yes'
                },
                append: false,
                publicPath: false
            },
            {
                tag: 'meta',
                attrs: {
                    name: 'apple-mobile-web-app-status-bar-style',
                    content: 'black-translucent'
                },
                append: false,
                publicPath: false
            },
            {
                tag: 'meta',
                attrs: {
                    name: 'apple-mobile-web-app-title',
                    content: 'E Roadmap'
                },
                append: false,
                publicPath: false
            }
        ]
    }
});
