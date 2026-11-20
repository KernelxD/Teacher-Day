import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { countWishes, describeWishes, readPage, sameCode, stampPage } from './og-image.mjs';

const SITE = 'https://example.web.app';
const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const built = source.replace('</head>', '<script type="module" crossorigin src="/assets/index-AAA.js"></script>\n'
  + '<link rel="stylesheet" crossorigin href="/assets/index-BBB.css">\n</head>');

test('the committed index.html carries the generic image', () => {
  assert.deepEqual(readPage(source), { count: null, assets: [] });
});

test('stamping puts the count in the image URL and both descriptions', () => {
  const stamped = stampPage(built, { site: SITE, count: 1234 });
  assert.equal(readPage(stamped).count, 1234);
  assert.match(stamped, /<meta property="og:image" content="https:\/\/example\.web\.app\/og-image\.png\?n=1234" \/>/);
  assert.equal(stamped.split(describeWishes(1234)).length, 3);
  assert.match(describeWishes(1234), /^Đã có 1\.234 lời chúc/);
});

test('stamping twice replaces the earlier count', () => {
  const twice = stampPage(stampPage(built, { site: SITE, count: 5 }), { site: SITE, count: 6 });
  assert.equal(readPage(twice).count, 6);
  assert.doesNotMatch(twice, /n=5"/);
});

test('stamping fails loudly when a preview tag is missing', () => {
  assert.throws(() => stampPage(built.replace(/<meta property="og:image" [^>]+>/, ''), { site: SITE, count: 1 }), /og:image/);
});

test('same code means the same hashed assets, in any order', () => {
  const live = readPage(built.replace('index-AAA.js"></script>\n<link rel="stylesheet" crossorigin href="/assets/index-BBB.css">',
    'index-BBB.css"></script>\n<link rel="stylesheet" crossorigin href="/assets/index-AAA.js">'));
  assert.ok(sameCode(readPage(built), live));
  assert.ok(!sameCode(readPage(built), readPage(built.replace('index-AAA', 'index-CCC'))));
  assert.ok(!sameCode(readPage(source), readPage(source)), 'a page without assets never counts as a match');
});

test('countWishes reads the Firestore aggregation result', async () => {
  const fetchImpl = async () => Response.json([{ result: { aggregateFields: { total: { integerValue: '102' } } } }]);
  assert.equal(await countWishes({ fetchImpl }), 102);
  await assert.rejects(countWishes({ fetchImpl: async () => Response.json([{}]) }), /Unexpected/);
  await assert.rejects(countWishes({ fetchImpl: async () => new Response('{}', { status: 403 }) }), /HTTP 403/);
});
