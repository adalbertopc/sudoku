import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import serviceWorker from './integrations/service-worker.mjs';

const site = (process.env.SITE_URL || 'https://sudoku.adal.dev').replace(/\/$/, '');

const alternates = [
  { es: '/', en: '/en/' },
  { es: '/imprimir/', en: '/en/print/' }
];

export default defineConfig({
  site,
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false }
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const group = alternates.find((g) => g.es === path || g.en === path);
        if (group) {
          item.links = [
            { lang: 'es', url: site + group.es },
            { lang: 'en', url: site + group.en },
            { lang: 'x-default', url: site + group.es }
          ];
          item.changefreq = 'monthly';
        }
        return item;
      }
    }),
    serviceWorker()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
