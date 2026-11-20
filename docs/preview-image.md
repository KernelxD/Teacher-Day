# Link preview image

When someone shares the site in Google Chat, Messenger, Zalo and similar apps, the preview
shows a picture of the wishing tree and the number of wishes sent so far, for example
"102 lời chúc đã gửi tới thầy cô".

## How it works

Link-preview bots don't run JavaScript, so the count has to be in the deployed files.

- `/og` is a hidden page that draws the 1200 × 630 image with the real tree and one tag per wish
  (`src/views/OgView.vue`). Open `/og?n=100` in the dev server to see it with any count.
- `scripts/og-image.mjs render` reads the count from Firestore, screenshots `/og?n=<count>` into
  `dist/og-image.png`, and stamps `dist/index.html`: `og:image` becomes `og-image.png?n=<count>`
  and the descriptions mention the count. Every new count gives a new image URL, so chat apps
  fetch the new picture instead of a cached one.
- `public/og-image.png` is the generic image without a number. A build that was never stamped
  (a plain `npm run build` + `firebase deploy`) uses it.
- `.github/workflows/og-image.yml` runs every 15 minutes. It compares the count in Firestore with
  the one the live page shows and, only when they differ, rebuilds `main`, renders, and redeploys
  Hosting. GitHub often starts scheduled runs late, so expect the count to lag by 15 to 30 minutes.

Apps also cache a link's preview on their side, so a link that was shared before may keep its
old picture for a while.

## One-time setup

1. **Deploy key.** The workflow needs the repository secret
   `FIREBASE_SERVICE_ACCOUNT_VTEC_TEACHER_DAY`. Adding repository secrets needs the repository
   owner. With Firebase CLI access to the project, run:

   ```sh
   firebase init hosting:github
   ```

   Pick `KernelxD/Teacher-Day`. Answer **No** to the build script and to automatic deployment on
   merge. It creates the service account and uploads the secret. Delete the
   `firebase-hosting-pull-request.yml` file it adds unless you want preview channels for pull requests.

2. **Put the code on `main`.** Scheduled workflows only run from the default branch, and the
   workflow builds `main`.

3. **First run.** Open **Actions → Update preview image → Run workflow**, tick **force**, and run it.
   Force is needed once because the live site was deployed from a local copy. It replaces the
   live site with `main`, so make sure `main` has everything that should be live.

## Deploying by hand

Use `npm run deploy` instead of `firebase deploy`. It builds, renders the image with the current
count, and deploys. Rendering needs a browser: Google Chrome, Playwright's Chromium
(`npx playwright-core install chromium`, once), or `CHROME_PATH=/path/to/chromium`.

## When the workflow fails

**"The live site runs different code than this build"**: the workflow refuses to deploy, because that
would put older code from `main` on the live site. It happens after a manual deploy of code that
isn't on `main` yet. Push that code to `main`. If `main` should replace the live site, run the
workflow by hand with **force**. Until then each scheduled run fails and GitHub emails you.

**"Missing the FIREBASE_SERVICE_ACCOUNT_VTEC_TEACHER_DAY secret"**: finish step 1 above.

**Firestore HTTP 403**: database reads were restricted. The count uses the same public read access
as the website.

## Changing the design

Edit `src/views/OgView.vue`, then:

```sh
npm run dev                                   # open /og?n=100 and /og
npm run build && node scripts/og-image.mjs generic   # redraw public/og-image.png, then commit it
```

To stop the updates after Teacher's Day, disable the workflow in the Actions tab.
