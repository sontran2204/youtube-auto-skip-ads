const activeTabs = new Set();

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.type !== 'click-skip' || sender.id !== chrome.runtime.id ||
      sender.frameId !== 0 || !Number.isInteger(sender.tab?.id) ||
      !sender.documentId || !sender.url?.startsWith('https://www.youtube.com/')) return;

  clickSkip(sender.tab.id, sender.documentId).then(respond);
  return true;
});

async function clickSkip(tabId, documentId) {
  if (activeTabs.has(tabId)) return { status: 'Input already in progress.' };
  activeTabs.add(tabId);

  const target = { tabId };
  let attached = false;
  try {
    await chrome.debugger.attach(target, '1.3');
    attached = true;

    const point = await chrome.tabs.sendMessage(tabId, { type: 'get-skip-point' }, { documentId });
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) {
      return { status: 'Skip button is no longer clickable.' };
    }

    const mouse = { x: point.x, y: point.y, button: 'left', clickCount: 1 };
    await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', {
      ...mouse, type: 'mousePressed', buttons: 1,
    });
    await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', {
      ...mouse, type: 'mouseReleased', buttons: 0,
    });
    return { status: 'Chrome sent a click to the Skip button.' };
  } catch (error) {
    return { status: `Chrome could not send the click: ${error.message}` };
  } finally {
    try {
      if (attached) await chrome.debugger.detach(target);
    } catch {
      // Chrome may already have detached if the tab closed.
    } finally {
      activeTabs.delete(tabId);
    }
  }
}
