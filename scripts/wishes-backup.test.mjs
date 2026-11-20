import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  collectWishes, restoreSnapshot,
  validateSnapshot, writeNewFile,
} from './wishes-backup.mjs';

const document = (id) => ({
  name: `projects/vtec-teacher-day/databases/(default)/documents/wishes/${id}`,
  fields: {
    author: { stringValue: 'Nguyễn An' }, message: { stringValue: 'Chúc cô hạnh phúc! 🌸' },
    createAt: { timestampValue: '2026-11-17T12:34:56.123456789Z' },
    target: { arrayValue: { values: [{ stringValue: 'Cô Hà' }] } },
    exactInteger: { integerValue: '9223372036854775807' },
  },
  createTime: '2026-11-17T12:34:56.123456Z', updateTime: '2026-11-17T12:34:56.123456Z',
});
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const oneSnapshot = () => collectWishes({ fetchImpl: async () => response({ documents: [document('one')] }) });

test('backs up more than 2,000 wishes, every page at the same snapshot time', async () => {
  const urls = [];
  const snapshot = await collectWishes({
    readTime: '2026-11-17T12:35:00.000Z',
    fetchImpl: async (url) => {
      urls.push(new URL(url));
      const page = Number(url.searchParams.get('pageToken') || 0);
      return response({
        documents: Array.from({ length: 500 }, (_, i) => document(`${page * 500 + i}`)),
        ...(page < 4 ? { nextPageToken: `${page + 1}` } : {}),
      });
    },
  });
  assert.equal(snapshot.documentCount, 2500);
  assert.equal(urls.length, 5);
  assert.ok(urls.every((url) => url.searchParams.get('readTime') === snapshot.readTime));
  assert.ok(urls.every((url) => !url.searchParams.has('orderBy')));
});

test('refuses empty, incomplete and repeated-page backups', async () => {
  await assert.rejects(collectWishes({ fetchImpl: async () => response({}) }), /empty backup/);
  let calls = 0;
  await assert.rejects(collectWishes({ fetchImpl: async () => ++calls === 1
    ? response({ documents: [document('one')], nextPageToken: 'next' })
    : response({ error: { status: 'PERMISSION_DENIED' } }, 403),
  }), /403/);
  await assert.rejects(collectWishes({ fetchImpl: async () => response({
    documents: [document('one')], nextPageToken: 'same',
  }) }), /Repeated/);
});

test('JSON round trip preserves Unicode, IDs, nanoseconds and int64 values', async () => {
  const snapshot = await oneSnapshot();
  assert.deepEqual(validateSnapshot(JSON.parse(JSON.stringify(snapshot))), snapshot);
});

test('rejects duplicate IDs and altered document contents', async () => {
  const snapshot = await oneSnapshot();
  const altered = structuredClone(snapshot);
  altered.documents[0].fields.message.stringValue = 'changed';
  assert.throws(() => validateSnapshot(altered), /checksum/);
  const duplicate = structuredClone(snapshot);
  duplicate.documents.push(duplicate.documents[0]);
  duplicate.documentCount = 2;
  duplicate.documentsSha256 = createHash('sha256').update(JSON.stringify(duplicate.documents)).digest('hex');
  assert.throws(() => validateSnapshot(duplicate), /duplicate/);
});

test('publishing a local file never replaces a previous good backup', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wishes-backup-test-'));
  try {
    const path = join(directory, 'good.json');
    await writeNewFile(path, 'first');
    await assert.rejects(writeNewFile(path, 'second'), { code: 'EEXIST' });
    assert.equal(await readFile(path, 'utf8'), 'first');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('restores are dry-run by default and require explicit project confirmation', async () => {
  const snapshot = await oneSnapshot();
  const noNetwork = async () => { throw new Error('Unexpected network request'); };
  assert.deepEqual(await restoreSnapshot(snapshot, { targetCollection: 'wishes-recovery', fetchImpl: noNetwork }), {
    dryRun: true, documentCount: 1, targetCollection: 'wishes-recovery',
  });
  await assert.rejects(restoreSnapshot(snapshot, { targetCollection: 'wishes', apply: true, fetchImpl: noNetwork }), /requires/);
});

test('restore uses original IDs and typed fields and skips existing documents', async () => {
  const snapshot = await collectWishes({ fetchImpl: async () => response({ documents: [document('one'), document('two')] }) });
  const requests = [];
  const result = await restoreSnapshot(snapshot, {
    targetCollection: 'wishes-recovery', apply: true, confirmProject: 'vtec-teacher-day', accessToken: 'test-token',
    fetchImpl: async (url, options) => {
      requests.push({ url: new URL(url), options });
      return requests.length === 1 ? response({}) : response({ error: { status: 'ALREADY_EXISTS' } }, 409);
    },
  });
  assert.deepEqual(result, { created: 1, skipped: 1, targetCollection: 'wishes-recovery' });
  assert.equal(requests[0].url.searchParams.get('documentId'), 'one');
  assert.deepEqual(JSON.parse(requests[0].options.body), { fields: snapshot.documents[0].fields });
  assert.ok(requests.every(({ options }) => options.method === 'POST'));
});
