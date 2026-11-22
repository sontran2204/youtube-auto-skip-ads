const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('clicks two successive Skip buttons in the same document', async () => {
  const source = name => readFileSync(path.join(__dirname, '..', name), 'utf8');
  const sender = {
    id: 'extension', frameId: 0, tab: { id: 1 }, documentId: 'video-document',
    url: 'https://www.youtube.com/watch?v=example',
  };
  let workerListener, contentListener, scan, button;
  const events = [];
  vm.runInNewContext(source('input.js'), {
    chrome: {
      runtime: { id: sender.id, onMessage: { addListener: fn => { workerListener = fn; } } },
      tabs: {
        sendMessage: async (id, message, options) => {
          assert.equal(id, sender.tab.id);
          assert.equal(options.documentId, sender.documentId);
          return new Promise(resolve => contentListener(message, { id: sender.id }, resolve));
        },
      },
      debugger: {
        attach: async () => { events.push('attach'); },
        detach: async () => { events.push('detach'); },
        sendCommand: async (_target, method, input) => {
          assert.equal(method, 'Input.dispatchMouseEvent');
          events.push(input.type);
          if (input.type === 'mouseReleased') button = undefined;
        },
      },
    },
  });

  vm.runInNewContext(source('skip.js'), {
    chrome: {
      runtime: {
        id: sender.id,
        onMessage: { addListener: fn => { contentListener = fn; } },
        sendMessage: message => new Promise(resolve => workerListener(message, sender, resolve)),
      },
    },
    document: {
      documentElement: {},
      querySelector: () => ({ querySelectorAll: () => button ? [button] : [] }),
      elementFromPoint: () => button,
    },
    performance: { now: () => 100 },
    console: { debug() {}, warn: assert.fail },
    MutationObserver: class { observe() {} },
    setInterval: fn => { scan = fn; },
  });

  for (const label of ['Skip ad', 'Bỏ qua']) {
    button = {
      innerText: label,
      isConnected: true,
      closest: () => null,
      matches: () => false,
      getAttribute: () => null,
      checkVisibility: () => true,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 20, height: 20 }),
      contains: element => element === button,
    };
    scan();
    await new Promise(setImmediate);
  }
  const click = ['attach', 'mousePressed', 'mouseReleased', 'detach'];
  assert.deepEqual(events, [...click, ...click]);
});
