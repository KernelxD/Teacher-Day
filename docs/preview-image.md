# Link preview image

When someone shares the site in Google Chat, Messenger, Zalo and similar apps, the preview
shows a picture of the wishing tree and the number of wishes sent so far, for example
"102 lời chúc đã gửi tới thầy cô".

## How it works

Link-preview bots don't run JavaScript, so the count has to be in the deployed files. It shows
the count at the time of the last `npm run deploy`; nothing refreshes it in between.

- `/og` is a hidden page that draws the 1200 × 630 image with the real tree and one tag per wish
  (`src/views/OgView.vue`). Open `/og?n=100` in the dev server to see it with any count.
- `scripts/og-image.mjs render` reads the count from Firestore, screenshots `/og?n=<count>` into
  `dist/og-image.png`, and stamps `dist/index.html`: `og:image` becomes `og-image.png?n=<count>`
  and the descriptions mention the count. Every new count gives a new image URL, so chat apps
  fetch the new picture instead of a cached one.
- `public/og-image.png` is the generic image without a number. A build that was never stamped
  (a plain `npm run build` + `firebase deploy`) uses it.

Apps also cache a link's preview on their side, so a link that was shared before may keep its
old picture for a while.

## Deploying by hand

Use `npm run deploy` instead of `firebase deploy`. It builds, renders the image with the current
count, and deploys. Rendering needs a browser: Google Chrome, Playwright's Chromium
(`npx playwright-core install chromium`, once), or `CHROME_PATH=/path/to/chromium`.

## Changing the design

Edit `src/views/OgView.vue`, then:

```sh
npm run dev                                   # open /og?n=100 and /og
npm run build && node scripts/og-image.mjs generic   # redraw public/og-image.png, then commit it
```
