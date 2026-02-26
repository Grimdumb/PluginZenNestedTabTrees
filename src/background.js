const TAB_TREES_KEY = "tabTrees";
const SETTINGS_KEY = "settings";

const DEFAULT_SETTINGS = {
  bookmarkOpenBehavior: "newRoot",
  manualOpenBehavior: "attachToActive",
  externalOpenBehavior: "attachToLastActive"
};

const tabTrees = new Map();
let lastActiveTabIdByWindow = new Map();
let persistTimer = null;

function toNode(tab, parentTabId, openerType = "unknown") {
  return {
    tabId: tab.id,
    windowId: tab.windowId,
    parentTabId,
    openerType,
    createdAt: new Date().toISOString()
  };
}

async function getSettings() {
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(stored[SETTINGS_KEY] || {})
  };
}

function schedulePersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(async () => {
    persistTimer = null;
    await browser.storage.local.set({
      [TAB_TREES_KEY]: Object.fromEntries(tabTrees.entries())
    });
  }, 100);
}

async function notifyTreeUpdated() {
  const payload = Array.from(tabTrees.values());
  await browser.runtime.sendMessage({ type: "tree-updated", payload }).catch(() => {});
}

async function loadState() {
  const data = await browser.storage.local.get(TAB_TREES_KEY);
  const persisted = data[TAB_TREES_KEY] || {};

  for (const [tabId, node] of Object.entries(persisted)) {
    tabTrees.set(Number(tabId), node);
  }
}

async function findActiveTabInWindow(windowId) {
  const tabs = await browser.tabs.query({ windowId, active: true });
  return tabs[0] || null;
}

async function determineFallbackParent(tab, settings) {
  const openerType = tab.url === "about:blank" ? "manual" : "external";

  if (openerType === "manual") {
    if (settings.manualOpenBehavior === "attachToActive") {
      const activeTab = await findActiveTabInWindow(tab.windowId);
      return { parentTabId: activeTab?.id ?? null, openerType };
    }
    return { parentTabId: null, openerType };
  }

  if (settings.externalOpenBehavior === "attachToLastActive") {
    return {
      parentTabId: lastActiveTabIdByWindow.get(tab.windowId) ?? null,
      openerType
    };
  }

  return { parentTabId: null, openerType };
}

async function registerTab(tab) {
  const settings = await getSettings();
  let parentTabId = tab.openerTabId ?? null;
  let openerType = parentTabId ? "link" : "unknown";

  if (!parentTabId) {
    const fallback = await determineFallbackParent(tab, settings);
    parentTabId = fallback.parentTabId;
    openerType = fallback.openerType;
  }

  tabTrees.set(tab.id, toNode(tab, parentTabId, openerType));
  schedulePersist();
  await notifyTreeUpdated();
}

async function removeTab(tabId) {
  const node = tabTrees.get(tabId);
  if (!node) {
    return;
  }

  tabTrees.delete(tabId);

  for (const [id, childNode] of tabTrees.entries()) {
    if (childNode.parentTabId === tabId) {
      tabTrees.set(id, {
        ...childNode,
        parentTabId: node.parentTabId ?? null
      });
    }
  }

  schedulePersist();
  await notifyTreeUpdated();
}

function buildTree() {
  return Array.from(tabTrees.values());
}

browser.tabs.onActivated.addListener(({ tabId, windowId }) => {
  lastActiveTabIdByWindow.set(windowId, tabId);
});

browser.tabs.onCreated.addListener((tab) => {
  registerTab(tab);
});

browser.tabs.onRemoved.addListener((tabId) => {
  removeTab(tabId);
});

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "get-tree") {
    return Promise.resolve({ payload: buildTree() });
  }

  if (message?.type === "settings-updated") {
    return notifyTreeUpdated();
  }

  return undefined;
});

(async function init() {
  await loadState();
  const tabs = await browser.tabs.query({});

  for (const tab of tabs) {
    if (!tabTrees.has(tab.id)) {
      tabTrees.set(tab.id, toNode(tab, tab.openerTabId ?? null, tab.openerTabId ? "link" : "unknown"));
    }
  }

  schedulePersist();
  await notifyTreeUpdated();
  console.log("[Zen Nested Tab Trees] extension initialized");
})();
