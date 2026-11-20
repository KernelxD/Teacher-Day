# Cloud wishes backups

Backups run in the private GitHub repository **trawngson/Teacher-Day-Backups**.

**Turned off on 20 November 2026.** The "Back up wishes" workflow is disabled, so no new
snapshots are made. Earlier snapshots stay in the repository. To resume, open its Actions tab,
pick **Back up wishes** and choose **Enable workflow**.
Your Mac does not need to be on. No Firebase billing upgrade, service-account key,
encryption key, Cloud Functions, or Cloud Storage bucket is needed.

The first cloud run succeeded on 17 November 2026 at 21:22 Vietnam time. Its snapshot
contains all 13 wishes and passed a downloaded checksum verification and restore preview.

- Status and manual backup: https://github.com/trawngson/Teacher-Day-Backups/actions/workflows/backup.yml
- Dated backup files: https://github.com/trawngson/Teacher-Day-Backups/tree/main/snapshots

## How it works

GitHub Actions reads every document in `vtec-teacher-day` → `(default)` → `wishes`
and commits a new dated JSON snapshot to the private repository. It runs at approximately
**01:17, 07:17, 13:17 and 19:17 Vietnam time**. GitHub can delay scheduled jobs.
Use **Actions → Back up wishes → Run workflow** for an extra backup.

Snapshots have no automatic expiry. They include original document IDs, all stored
fields and Firestore types, the original `createAt` timestamp, a document count, and a
SHA-256 checksum. Pagination reads the same point in time across all pages; there is no
2,000-wish limit. Empty or incomplete reads fail without replacing an older backup.

The repository must remain **private**, since snapshots contain the wishes in readable
JSON. The workflow checks repository privacy before reading the database. It has no
Firestore write credential and uses the same public read access as the website. If you
later restrict database reads or enable App Check, update the job's authentication;
never loosen database rules to fix a backup failure.

Only top-level `wishes` documents are covered. If you add subcollections, other collections,
Authentication data or uploaded files, extend the backup setup to include those.

## Free usage and limits

Four short jobs per day use roughly 120 GitHub runner minutes per month, within the
GitHub Free allowance of 2,000 minutes for private repositories, shared with other jobs
in the account. Snapshots use normal Git repository storage, not paid artifact storage.
No paid services or billing upgrades are enabled by this setup.

Firestore reads are shared with the website's quota. With the current 13 wishes, four
backups use about 52 reads per day, plus retries, against the default database's 50,000
free daily reads. A quota exhaustion or GitHub outage can delay a backup.

Check workflow status occasionally and enable Actions failure notifications in your
GitHub notification settings. Download a final archive after
Teacher's Day so you also have a copy independent of GitHub. Recovery normally reaches
back to the latest successful snapshot; wishes submitted afterwards wait for the next run.

## Verify or restore

Download the desired JSON file from `snapshots/`. Use Node.js 22 or later; no dependency
installation is needed. The backup repository contains the same scripts as this project.

```sh
node scripts/wishes-backup.mjs verify --input PATH_TO_SNAPSHOT.json
node scripts/wishes-backup.mjs restore --input PATH_TO_SNAPSHOT.json \
  --target-collection wishes-recovery
```

`restore` previews the document count and makes **no writes** unless `--apply` is supplied.
For an actual recovery, provide a short-lived Google OAuth access token in the
`FIRESTORE_ACCESS_TOKEN` environment variable for an account with Firestore document-create
permission, then add `--apply --confirm-project vtec-teacher-day`.

First restore into `wishes-recovery` and compare document counts, messages, and timestamps.
After checking, repeat with `--target-collection wishes` to recover missing wishes in the live
collection. Existing document IDs are skipped; the script never deletes or overwrites wishes.
The original stored fields, including `createAt`, are preserved. Recreated documents get new
Firestore system `createTime` and `updateTime` metadata. Existing corrupt documents need manual
review; they are not overwritten. No live restore was run during setup.

## Tests

```sh
node --test scripts/wishes-backup.test.mjs
```

Tests cover 2,500 wishes, consistent pagination, failed and empty reads, lossless Unicode and
Firestore types, checksums, duplicate IDs, safe file publication, dry-run recovery, and skipping
existing wishes. The first cloud snapshot is also downloaded and verified during setup.

References: [Firestore quotas](https://firebase.google.com/docs/firestore/pricing),
[GitHub Free usage](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[Firestore REST pagination](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/list).
