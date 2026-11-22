const ruleset = 'youtube_ads';
const autoSkip = document.querySelector('#auto-skip');
const adBlocking = document.querySelector('#ad-blocking');
const blockNotifications = document.querySelector('#block-notifications');
const status = document.querySelector('#status');

async function refresh() {
  try {
    const [settings, enabledRulesets] = await Promise.all([
      chrome.storage.local.get({ autoSkip: true, blockNotifications: true }),
      chrome.declarativeNetRequest.getEnabledRulesets(),
    ]);
    autoSkip.checked = settings.autoSkip;
    adBlocking.checked = enabledRulesets.includes(ruleset);
    blockNotifications.checked = settings.blockNotifications;
    blockNotifications.disabled = false;
    autoSkip.disabled = false;
    adBlocking.disabled = false;
  } catch {
    status.textContent = 'Could not load settings. Close and reopen this popup to try again.';
  }
}

function save(control, update) {
  control.addEventListener('change', async () => {
    const enabled = control.checked;
    control.disabled = true;
    status.textContent = '';
    try {
      await update(enabled);
    } catch {
      control.checked = !enabled;
      status.textContent = 'Could not save this setting. Please try again.';
    } finally {
      control.disabled = false;
    }
  });
}

save(autoSkip, enabled => chrome.storage.local.set({ autoSkip: enabled }));
save(adBlocking, enabled => chrome.declarativeNetRequest.updateEnabledRulesets(
  enabled ? { enableRulesetIds: [ruleset] } : { disableRulesetIds: [ruleset] },
));
save(blockNotifications, enabled => chrome.storage.local.set({ blockNotifications: enabled }));
void refresh();
