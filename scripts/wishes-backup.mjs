import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, link, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const PROJECT = 'vtec-teacher-day';
const ROOT = `projects/${PROJECT}/databases/(default)/documents`;
const checksum = (documents) => createHash('sha256').update(JSON.stringify(documents)).digest('hex');

export async function requestJson(url, { fetchImpl = fetch, retries = 3, ...options } = {}) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(30_000) });
    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      await new Promise((done) => setTimeout(done, 1000 * 2 ** attempt));
      continue;
    }
    const body = await response.json();
    if (!response.ok) {
      // Do not log response bodies: they might contain wishes or credentials.
      const error = new Error(`Firestore HTTP ${response.status} (${body.error?.status || 'request failed'})`);
      error.status = response.status;
      throw error;
    }
    return body;
  }
}

export function validateSnapshot(snapshot) {
  if (snapshot.format !== 'vtec-wishes-snapshot-v1' || snapshot.project !== PROJECT
      || snapshot.database !== '(default)' || snapshot.collection !== 'wishes'
      || !Array.isArray(snapshot.documents) || snapshot.documents.length === 0
      || snapshot.documentCount !== snapshot.documents.length) throw new Error('Invalid wishes snapshot');
  const ids = new Set();
  for (const document of snapshot.documents) {
    const prefix = `${ROOT}/wishes/`;
    if (typeof document.name !== 'string' || !document.name.startsWith(prefix)) throw new Error('Unexpected document path');
    const id = document.name.slice(prefix.length);
    if (!id || id.includes('/') || ids.has(id)
        || (document.fields !== undefined && (typeof document.fields !== 'object' || document.fields === null || Array.isArray(document.fields)))) {
      throw new Error('Invalid or duplicate document');
    }
    ids.add(id);
  }
  if (snapshot.documentsSha256 !== checksum(snapshot.documents)) throw new Error('Snapshot checksum mismatch');
  return snapshot;
}

export async function collectWishes({ fetchImpl = fetch, readTime = new Date(Date.now() - 5000).toISOString() } = {}) {
  const documents = [];
  const tokens = new Set();
  let pageToken;
  do {
    const url = new URL(`https://firestore.googleapis.com/v1/${ROOT}/wishes`);
    url.searchParams.set('pageSize', '500');
    url.searchParams.set('readTime', readTime);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const page = await requestJson(url, { fetchImpl });
    if (page.documents !== undefined && !Array.isArray(page.documents)) throw new Error('Invalid Firestore page');
    documents.push(...(page.documents || []));
    pageToken = page.nextPageToken;
    if (pageToken && tokens.has(pageToken)) throw new Error('Repeated Firestore page token');
    tokens.add(pageToken);
  } while (pageToken);
  if (documents.length === 0) throw new Error('No wishes found; refusing to publish an empty backup');
  return validateSnapshot({
    format: 'vtec-wishes-snapshot-v1', project: PROJECT, database: '(default)',
    collection: 'wishes', readTime, documentCount: documents.length,
    documentsSha256: checksum(documents), documents,
  });
}

export async function writeNewFile(filename, contents) {
  await mkdir(dirname(filename), { recursive: true, mode: 0o700 });
  const temporary = `${filename}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, contents, { mode: 0o600, flag: 'wx' });
    await link(temporary, filename); // Atomic and exclusive; never replace a good snapshot.
  } finally { await unlink(temporary).catch(() => {}); }
}

export async function restoreSnapshot(snapshot, {
  targetCollection, apply = false, confirmProject, accessToken, fetchImpl = fetch,
} = {}) {
  validateSnapshot(snapshot);
  if (!targetCollection || !/^[A-Za-z0-9_-]+$/.test(targetCollection)) throw new Error('Specify a valid --target-collection');
  if (!apply) return { dryRun: true, documentCount: snapshot.documentCount, targetCollection };
  if (confirmProject !== PROJECT || !accessToken) {
    throw new Error(`Restoring requires --confirm-project ${PROJECT} and FIRESTORE_ACCESS_TOKEN`);
  }
  let created = 0;
  let skipped = 0;
  for (const document of snapshot.documents) {
    const url = new URL(`https://firestore.googleapis.com/v1/${ROOT}/${targetCollection}`);
    url.searchParams.set('documentId', document.name.split('/').at(-1));
    try {
      await requestJson(url, {
        fetchImpl, retries: 0, method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: document.fields || {} }),
      });
      created++;
    } catch (error) {
      if (error.status !== 409) throw error;
      skipped++;
    }
  }
  return { created, skipped, targetCollection };
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    input: { type: 'string' }, 'output-dir': { type: 'string', default: 'backups' },
    'target-collection': { type: 'string' }, 'confirm-project': { type: 'string' },
    apply: { type: 'boolean', default: false },
  } });
  if (positionals[0] === 'backup') {
    const snapshot = await collectWishes();
    const filename = join(values['output-dir'], `wishes-${snapshot.readTime.replace(/[:.]/g, '-')}.json`);
    const contents = `${JSON.stringify(snapshot, null, 2)}\n`;
    if (Buffer.byteLength(contents) > 10 * 1024 * 1024) throw new Error('Snapshot exceeds 10 MiB; review storage and quotas before publishing');
    await writeNewFile(filename, contents);
    console.log(`Verified backup: ${snapshot.documentCount} wishes; ${filename}`);
    return;
  }
  if (['verify', 'restore'].includes(positionals[0])) {
    if (!values.input) throw new Error('Specify --input');
    const snapshot = validateSnapshot(JSON.parse(await readFile(values.input, 'utf8')));
    const result = positionals[0] === 'verify'
      ? { verified: true, documentCount: snapshot.documentCount, readTime: snapshot.readTime }
      : await restoreSnapshot(snapshot, {
        targetCollection: values['target-collection'], apply: values.apply,
        confirmProject: values['confirm-project'], accessToken: process.env.FIRESTORE_ACCESS_TOKEN,
      });
    console.log(JSON.stringify(result));
    return;
  }
  throw new Error('Usage: node scripts/wishes-backup.mjs <backup|verify|restore> [options]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
