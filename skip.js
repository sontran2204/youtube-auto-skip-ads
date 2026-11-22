(() => {
  const playerSelector = '#movie_player, .html5-video-player, #ytd-player, ytd-player';
  const skipControl = [
    '[id^="skip-button:"]',
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button-slot',
  ].join(', ');
  const skipLabel = /^(?:skip(?: ads?)?|bỏ qua(?: quảng cáo)?)$/iu;
  const lastClick = new WeakMap();
  let scanQueued = false;

  function isSkipButton(button) {
    if (button.closest(skipControl)) return true;

    const labelledBy = (button.getAttribute('aria-labelledby') ?? '').match(/\S+/g) ?? [];
    const referencedLabel = labelledBy
      .map(id => document.getElementById(id)?.textContent ?? '')
      .join(' ');

    return [
      button.getAttribute('aria-label'),
      referencedLabel,
      button.innerText,
      button.getAttribute('title'),
    ].some(label => skipLabel.test(label?.trim().replace(/\s+/g, ' ') ?? ''));
  }

  let pendingButton;
  let clickPending = false;

  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || message.type !== 'get-skip-point') return;
    const button = pendingButton;
    if (!button?.isConnected || !isSkipButton(button) || button.matches(':disabled') ||
        button.closest('[aria-disabled="true"], [aria-hidden="true"], [inert]') ||
        !button.checkVisibility({ opacityProperty: true, visibilityProperty: true })) {
      respond(null);
      return;
    }

    const bounds = button.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const target = document.elementFromPoint(x, y);
    respond(target && button.contains(target) ? { x, y } : null);
  });

  async function activateSkip(button) {
    pendingButton = button;
    clickPending = true;
    try {
      const result = await chrome.runtime.sendMessage({ type: 'click-skip' });
      console.debug('[YouTube Auto Skip]', result?.status ?? 'No response from input handler.');
    } catch (error) {
      console.warn('[YouTube Auto Skip] Input request failed:', error.message);
    } finally {
      pendingButton = undefined;
      clickPending = false;
    }
  }

  function skipAd() {
    scanQueued = false;
    if (clickPending) return;
    const player = document.querySelector(playerSelector);
    if (!player) return;

    for (const button of player.querySelectorAll('button, [role="button"]')) {
      if (!isSkipButton(button)) continue;
      if (button.matches(':disabled') || button.closest('[aria-disabled="true"], [aria-hidden="true"], [inert]')) continue;
      if (!button.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;

      const now = performance.now();
      if (now - (lastClick.get(button) ?? -Infinity) < 3000) continue;

      lastClick.set(button, now);
      void activateSkip(button);
      return;
    }
  }

  const observer = new MutationObserver(() => {
    if (scanQueued) return;
    scanQueued = true;
    setTimeout(skipAd, 0);
  });

  console.debug('[YouTube Auto Skip] Content script ready.');
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-disabled', 'aria-hidden', 'aria-label', 'aria-labelledby', 'class', 'disabled', 'hidden', 'inert', 'style', 'title'],
  });
  skipAd();
  setInterval(skipAd, 300);
})();
