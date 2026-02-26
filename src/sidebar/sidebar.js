const treeContainer = document.getElementById("tree");

function buildChildrenMap(nodes) {
  const map = new Map();

  for (const node of nodes) {
    if (!map.has(node.parentTabId)) {
      map.set(node.parentTabId, []);
    }
    map.get(node.parentTabId).push(node);
  }

  return map;
}

async function getActiveTabId() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id ?? null;
}

function renderNode(node, childrenMap, depth, activeTabId) {
  const wrapper = document.createElement("div");
  wrapper.className = "tree-node";
  wrapper.style.setProperty("--depth", String(depth));

  const button = document.createElement("button");
  button.textContent = `Tab ${node.tabId} (${node.openerType})`;

  if (node.tabId === activeTabId) {
    button.classList.add("is-active");
  }

  button.addEventListener("click", async () => {
    await browser.tabs.update(node.tabId, { active: true });
  });

  wrapper.appendChild(button);

  const children = childrenMap.get(node.tabId) || [];
  for (const child of children) {
    wrapper.appendChild(renderNode(child, childrenMap, depth + 1, activeTabId));
  }

  return wrapper;
}

async function renderTree(nodes) {
  treeContainer.innerHTML = "";

  const activeTabId = await getActiveTabId();
  const childrenMap = buildChildrenMap(nodes);
  const roots = childrenMap.get(null) || [];

  for (const root of roots) {
    treeContainer.appendChild(renderNode(root, childrenMap, 0, activeTabId));
  }
}

async function refresh() {
  const response = await browser.runtime.sendMessage({ type: "get-tree" });
  await renderTree(response.payload || []);
}

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "tree-updated") {
    renderTree(message.payload || []);
  }
});

refresh();
