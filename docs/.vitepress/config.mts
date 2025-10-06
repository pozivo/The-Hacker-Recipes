import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import githubAlertsPlugin from './plugins/githubAlertsPlugin';
import youtubeEmbedPlugin from './plugins/youtubeEmbedPlugin';
import lineNumberPlugin from './plugins/lineNumbers';
/*import { linkToCardPlugin } from '@luckrya/markdown-it-link-to-card';
import type { LinkToCardPluginOptions } from '@luckrya/markdown-it-link-to-card';*/




// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "The Hacker Recipes",
    srcDir: 'src',
    description: "The Hacker Recipes is aimed at freely providing technical guides on various hacking topics",
    cleanUrls: true,
    lastUpdated: true,
    sitemap: {
        hostname: 'https://thehacker.recipes'
    },
    head: [
        ['meta', { name: 'theme-color', content: '#1b1b1f' }],
        ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/images/apple-touch-icon.png' }],
        ['link', { rel: 'icon', href: '/images/favicon.ico' }],
        ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/images/favicon-32x32.png' }],
        ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/images/favicon-16x16.png' }],
        ['link', { rel: 'manifest', href: '/images/site.webmanifest' }],
        ['link', { rel: 'mask-icon', href: '/images/safari-pinned-tab.svg', color: '#5bbad5' }],
        ['meta', { name: 'msapplication-TileColor', content: '#da532c' }],
        ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0' }],
        ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-211RDJSM3Y' }],
        ['script', {}, "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-211RDJSM3Y');" ]
    ],
    transformHead: ({ pageData }) => {
        const pageTitle = pageData.title ? `${pageData.title} | The Hacker Recipes` : 'The Hacker Recipes';
        const pageDescription = pageData.description || 'Comprehensive cybersecurity guides and strategies for ethical hacking and penetration testing';
        return [
            ['title', {}, pageTitle],
            ['meta', { property: 'og:title', content: pageTitle }],
            ['meta', { property: 'og:description', content: pageDescription }],
            ['meta', { property: 'og:image', content: 'https://thehacker.recipes/images/social-preview.png' }],
            ['meta', { name: 'twitter:title', content: pageTitle }],
            ['meta', { name: 'twitter:image', content: 'https://thehacker.recipes/images/social-preview.png' }],
            ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
            ['meta', { name: 'twitter:description', content: pageDescription }]
        ];
    },
    themeConfig: {
        logo: {
            dark: '/images/logo.svg',
            light: '/images/logo.svg'
        },
        /*carbonAds: {
          code: 'SOMETHING',
          placement: 'idontknow'
        },*/
        search: {
            provider: 'local'
        },
        nav: [
            /*{ text: 'Tools', link: 'https://tools.thehacker.recipes/' },
            { text: 'Exegol', link: 'https://exegol.readthedocs.io/en/latest/' },*/
        ],
        outline: "deep",
        sidebar: [
            {
                "text": "Active Directory",
                "collapsed": false,
                "items": [
                    {
                        "text": "Kerberos",
                        "link": "/ad/kerberos/index.md",
                        "collapsed": true,
                        "items": [
                            {
                                "text": "Ticket Request Attacks",
                                "link": "/ad/kerberos/TicketRequestAttacks.md",
                            },
                            {
                                "text": "Ticket Abuse Attacks",
                                "link": "/ad/kerberos/DelegationAttacks.md"
                            }
                        ]
                    },
                ]
            },
           
            /*{
                "text": "Contributing & misc",
                "collapsed": false,
                "items": [
                    {
                        "text": "Write 📝",
                        "link": "/contributing/write.md"
                    },
                    {
                        "text": "Donate ❤️",
                        "link": "/contributing/donate.md"
                    },
                    {
                        "text": "Buy ads 🌟",
                        "link": "/contributing/ads.md"
                    },
                    {
                        "text": "Variables 🔄",
                        "link": "/contributing/variables.md"
                    }
                ]
            },*/
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/The-Hacker-Recipes/The-Hacker-Recipes' },

        ],
        editLink: {
            text: "Contribute to this page",
            pattern: 'https://github.com/The-Hacker-Recipes/The-Hacker-Recipes/edit/main/docs/src/:path'
        }
    },
    markdown: {
        config(md) {
            md.use(tabsMarkdownPlugin);
            md.use(githubAlertsPlugin);
            md.use(youtubeEmbedPlugin);
            md.use(lineNumberPlugin);
            /*md.use<LinkToCardPluginOptions>(linkToCardPlugin, {
                width: '100%',
            });*/
        }
    },
})
