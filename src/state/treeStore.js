const TAB_TREES_KEY = "tabTrees";

const tabTrees = new Map();
let writeTimer = null;

function nowIso() {
  return new Date().toISOString();
}

function serializeMap(map) {
  return Object.fromEntries(map.entries());
}

function toNode(tab, parentTabId, openerType = "unknown") {
  return {
    tabId: tab.id,
    windowId: tab.windowId,
    parentTabId,
    openerType,
    createdAt: nowIso()
  };
}

async function loadState() {
  const data = await browser.storage.local.get(TAB_TREES_KEY);
  const persisted = data[TAB_TREES_KEY] || {};

  for (const [tabId, node] of Object.entries(persisted)) {
    tabTrees.set(Number(tabId), node);
  }
}

function schedulePersist() {
  if (writeTimer) {
    clearTimeout(writeTimer);
  }

  writeTimer = setTimeout(async () => {
    writeTimer = null;
    await browser.storage.local.set({ [TAB_TREES_KEY]: serializeMap(tabTrees) });
  }, 100);
}

function setNode(tab, parentTabId, openerType) {
  const node = toNode(tab, parentTabId, openerType);
  tabTrees.set(tab.id, node);
  schedulePersist();
  return node;
}

function getNode(tabId) {
  return tabTrees.get(tabId) || null;
}

function removeNode(tabId) {
  const node = tabTrees.get(tabId);
  if (!node) {
    return;
  }

  const parentTabId = node.parentTabId;
  tabTrees.delete(tabId);

  for (const [id, childNode] of tabTrees.entries()) {
    if (childNode.parentTabId === tabId) {
      tabTrees.set(id, {
        ...childNode,
        parentTabId: parentTabId ?? null
      });
    }
  }

  schedulePersist();
}

function listNodes() {
  return Array.from(tabTrees.values());
}

if (typeof module !== "undefined") {
  module.exports = {
    loadState,
    setNode,
    getNode,
    removeNode,
    listNodes
  };
}
