// Link-preview image (og:image) with the live wish count. See docs/preview-image.md.
//
//   node scripts/og-image.mjs check     Compare the wish count with the one the live preview shows.
//   node scripts/og-image.mjs guard     Fail if dist/ was built from different code than the live site.
//   node scripts/og-image.mjs render    Screenshot /og into dist/og-image.png and stamp dist/index.html.
//   node scripts/og-image.mjs generic   Redraw the countless fallback, public/og-image.png.
//
// Link-preview bots don't run JavaScript, so the count has to be in the HTML and the PNG.
// The image URL carries the count (og-image.png?n=123): each new count is a new URL, so chat
// apps fetch the new picture instead of reusing a cached one.
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const PROJECT = 'vtec-teacher-day';
export const DEFAULT_SITE = 'https://vtec-teacher-day.web.app';
const SIZE = { width: 1200, height: 630 };

export function describeWishes(count) {
  return `Đã có ${count.toLocaleString('vi-VN')} lời chúc gửi tới thầy cô. Cùng viết lời chúc nhân Ngày Nhà giáo Việt Nam 20/11.`;
}

export async function countWishes({ fetchImpl = fetch } = {}) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runAggregationQuery`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredAggregationQuery: {
        structuredQuery: { from: [{ collectionId: 'wishes' }] },
        aggregations: [{ alias: 'total', count: {} }],
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Firestore HTTP ${response.status}`);
  const body = await response.json();
  const count = Number(body?.[0]?.result?.aggregateFields?.total?.integerValue);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Unexpected Firestore count response');
  return count;
}

export async function fetchLiveHtml(site, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(`${site}/`, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Live site HTTP ${response.status}`);
  return response.text();
}

function metaPattern(attr, key) {
  return new RegExp(`(<meta\\s+${attr}="${key.replace(/[.:]/g, '\\$&')}"\\s+content=")([^"]*)(")`);
}

// What a built or live index.html says: the count in its preview image URL (null when the page
// carries the generic image) and the hashed /assets files, which identify the code it runs.
export function readPage(html) {
  const image = html.match(metaPattern('property', 'og:image'))?.[2] ?? '';
  const n = image.match(/[?&]n=(\d+)/)?.[1];
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]).sort();
  return { count: n === undefined ? null : Number(n), assets };
}

const escapeAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function stampPage(html, { site, count }) {
  const values = [
    ['property', 'og:image', `${site}/og-image.png?n=${count}`],
    ['name', 'description', describeWishes(count)],
    ['property', 'og:description', describeWishes(count)],
  ];
  let out = html;
  for (const [attr, key, value] of values) {
    const pattern = metaPattern(attr, key);
    if (!pattern.test(out)) throw new Error(`index.html has no <meta ${attr}="${key}" content="..."> tag`);
    out = out.replace(pattern, (_, start, _old, end) => start + escapeAttr(value) + end);
  }
  return out;
}

export function sameCode(built, live) {
  return built.assets.length > 0 && built.assets.join('\n') === live.assets.join('\n');
}

// CHROME_PATH (any Chromium build) wins. Otherwise use Google Chrome, which GitHub's runners
// have, and then Playwright's own Chromium from `npx playwright-core install chromium`.
async function launchBrowser(chromium) {
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH });
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch {
    try {
      return await chromium.launch();
    } catch {
      throw new Error('No browser found. Install Google Chrome, run `npx playwright-core install chromium`, '
        + 'or set CHROME_PATH to a Chromium executable.');
    }
  }
}

// Serves dist/ with `vite preview` and screenshots /og (or /og?n=count) at 1200 x 630.
export async function screenshot({ count, out }) {
  const { preview } = await import('vite');
  const { chromium } = await import('playwright-core');
  const browser = await launchBrowser(chromium);
  const server = await preview({ logLevel: 'warn', preview: { port: 4317, open: false } });
  try {
    const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const url = new URL(count === null ? 'og' : `og?n=${count}`, server.resolvedUrls.local[0]);
    await page.goto(url.href, { waitUntil: 'networkidle' });
    await page.waitForSelector('html[data-og-ready]', { timeout: 30_000 });
    await page.screenshot({ path: out, type: 'png', clip: { x: 0, y: 0, ...SIZE } });
  } finally {
    await browser.close();
    await server.close();
  }
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      site: { type: 'string', default: process.env.SITE_URL || DEFAULT_SITE },
      count: { type: 'string' },
    },
  });
  const site = values.site.replace(/\/+$/, '');
  const command = positionals[0];

  if (command === 'check') {
    const [count, live] = await Promise.all([countWishes(), fetchLiveHtml(site).then(readPage)]);
    const changed = live.count !== count;
    console.log(`Wishes: ${count}. Live preview shows: ${live.count ?? 'the generic image'}. ${changed ? 'Update needed.' : 'Up to date.'}`);
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `count=${count}\nchanged=${changed}\n`);
  } else if (command === 'guard') {
    const built = readPage(await readFile('dist/index.html', 'utf8'));
    const live = readPage(await fetchLiveHtml(site));
    if (!sameCode(built, live)) {
      throw new Error([
        'The live site runs different code than this build, so deploying would replace it.',
        `  live:  ${live.assets.join(', ') || '(no /assets files found)'}`,
        `  build: ${built.assets.join(', ')}`,
        'Someone probably deployed from a copy that is not on this branch yet. Push that code,',
        'or run the workflow by hand with "force" to put this branch on the live site.',
      ].join('\n'));
    }
    console.log('The live site runs the same code as this build.');
  } else if (command === 'render') {
    const count = values.count === undefined ? await countWishes() : Number(values.count);
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('--count must be a whole number');
    await screenshot({ count, out: 'dist/og-image.png' });
    const html = await readFile('dist/index.html', 'utf8');
    await writeFile('dist/index.html', stampPage(html, { site, count }));
    console.log(`Rendered dist/og-image.png and stamped dist/index.html with ${count} wishes.`);
  } else if (command === 'generic') {
    await screenshot({ count: null, out: 'public/og-image.png' });
    console.log('Rendered public/og-image.png. Commit it as the fallback preview.');
  } else {
    throw new Error('Usage: node scripts/og-image.mjs check | guard | render [--count N] | generic');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
