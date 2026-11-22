# YouTube Ad Block

Whenever an ad appears on a YouTube video, this Chrome extension waits for the **Skip ad** button and clicks it for you as soon as it appears. You can also turn on Ad Blocking to stop requests to known ad endpoints.

**Example:** If an ad is 10 seconds long and the **Skip ad** button appears after 5 seconds, the extension clicks it for you as soon as it’s available. You can get back to your video without clicking the button yourself.

## Install in Chrome

1. On GitHub, select **Code → Download ZIP**, then unzip the download.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked** and choose the extracted folder containing `manifest.json`.
4. Refresh any YouTube tabs that were already open.

[Chrome’s guide to loading unpacked extensions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)

## Toolbar controls

| Switch | What it does | Default |
| --- | --- | --- |
| **Auto Skip** | Clicks the **Skip ad** button when it appears. | On |
| **Ad Blocking** | Blocks requests to known ad endpoints on YouTube. Some video ads may still play. | Off |
| **Block Notifications** | Shows a Chrome alert when the extension blocks an ad request. | On |

Use the switches independently. To receive block alerts, turn on both **Ad Blocking** and **Block Notifications** and allow Chrome notifications in your system settings. Alerts are available in the unpacked build and report blocked requests. A video ad can still play through a different request.

## How it works

- `skip.js` observes YouTube’s player for changes and periodically checks for a visible, enabled skip button. It first recognizes YouTube’s skip controls by their HTML identifiers and classes, which do not depend on the interface language. English and Vietnamese labels are fallback checks. A player layout that uses different identifiers and classes may require an update.
- `input.js` rechecks the button’s position in the originating document and sends a mouse press and release through Chrome’s debugger API. It detaches afterward.

Chrome’s `debugger` permission can inspect and control tabs. This implementation accepts requests from its own YouTube content script and uses the permission to send the skip click.

## Verify it

Run `node --test test/skip.test.cjs` with Node.js. The test feeds two successive skip buttons to the content script and checks that the service worker sends one click for each in the same simulated document.

### Live Auto Skip testing

The extension automatically clicks **Skip ad** whenever the button appears, whether the ad plays before, during, or after a video.

In a live Auto Skip test reported by the project owner, YouTube played two ads back to back. The extension clicked **Skip ad** on the first ad after five seconds, then clicked it again when the button appeared on the second ad. The same thing happened when ads appeared later while the video was playing. Whenever the **Skip ad** button appeared, the extension clicked it for you.
