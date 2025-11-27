import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import * as path from 'node:path';
import { pluginHtmlMinifierTerser } from 'rsbuild-plugin-html-minifier-terser';

export default defineConfig({
    plugins: [
        pluginReact(),
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
        distPath: 'static',
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
        rspack: {}
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
            },
            '/socket.io': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                ws: true
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
            }
        ]
    }
});
