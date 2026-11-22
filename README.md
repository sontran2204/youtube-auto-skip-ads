# YouTube Auto Skip Ads

A Chrome extension that automatically clicks **Skip ad** whenever the button appears while you’re watching a YouTube video. Ads without a skip button play normally.

**Example:** If an ad is 10 seconds long and the **Skip ad** button appears after 5 seconds, the extension clicks it for you as soon as it’s available. You can get back to your video without clicking the button yourself.

## Install in Chrome

1. On GitHub, select **Code → Download ZIP**, then unzip the download.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked** and choose the extracted folder containing `manifest.json`.
4. Refresh any YouTube tabs that were already open.

[Chrome’s guide to loading unpacked extensions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)

## How it works

- `skip.js` observes YouTube’s player for changes and periodically checks for a visible, enabled skip button. It first recognizes YouTube’s skip controls by their HTML identifiers and classes, which do not depend on the interface language. English and Vietnamese labels are fallback checks. A player layout that uses different identifiers and classes may require an update.
- `input.js` rechecks the button’s position in the originating document and sends a mouse press and release through Chrome’s debugger API. It detaches afterward.

Chrome’s `debugger` permission can inspect and control tabs. This implementation accepts requests from its own YouTube content script and uses the permission to send the skip click.

## Verify it

Run `node --test test/skip.test.cjs` with Node.js. The test feeds two successive skip buttons to the content script and checks that the service worker sends one click for each in the same simulated document.

Individual pre-roll and post-roll skips were verified on YouTube. Two successive skips passed in simulation. A playback with two live skippable ads is still unverified.
