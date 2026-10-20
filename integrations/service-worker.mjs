import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Files that are never precached: crawler-only files, share images and the 404 page.
const EXCLUDE = [/^_headers$/, /^sw\.js$/, /^404\.html$/, /^og\//, /^sitemap.*\.xml$/, /^robots\.txt$/, /^llms\.txt$/];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))
  );
  return files.flat();
}

// "en/print/index.html" -> "/en/print/", matching trailingSlash: 'always'.
function toUrl(file) {
  return '/' + file.replace(/(^|\/)index\.html$/, '$1');
}

function source(version, urls) {
  return `const CACHE = "sudoku-${version}"
const PRECACHE = ${JSON.stringify(urls)}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("sudoku-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== "GET" || url.origin !== self.location.origin) return

  // Pages: network first so deploys show up right away, cache when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.redirected) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(url.pathname, copy))
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE)
          const fallback = url.pathname.startsWith("/en/") ? "/en/" : "/"
          return (await cache.match(url.pathname, { ignoreVary: true })) || (await cache.match(fallback, { ignoreVary: true })) || Response.error()
        }),
    )
    return
  }

  // Hashed assets, icons and fonts: cache first.
  event.respondWith(caches.match(request, { ignoreSearch: true, ignoreVary: true }).then((cached) => cached || fetch(request)))
})
`;
}

export default function serviceWorker() {
  return {
    name: 'service-worker',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await walk(root))
          .map((f) => relative(root, f).split(sep).join('/'))
          .filter((f) => !EXCLUDE.some((re) => re.test(f)))
          .sort();
        const hash = createHash('sha256');
        for (const f of files) {
          hash.update(f);
          hash.update(await readFile(join(root, f)));
        }
        const version = hash.digest('hex').slice(0, 12);
        const urls = files.map(toUrl);
        await writeFile(join(root, 'sw.js'), source(version, urls));
        logger.info(`sw.js created with ${urls.length} precached files (sudoku-${version})`);
      }
    }
  };
}
