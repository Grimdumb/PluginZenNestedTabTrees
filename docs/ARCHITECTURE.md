# Architecture: Zen Nested Tab Trees

## 1) Problem framing

Browsers expose tabs as a flat list, but user intent is often hierarchical.

This extension models a browsing session as a tree:

- Parent tab: the tab where a navigation branch began.
- Child tab: a tab opened from that parent.

## 2) Data model

A tracked tab node is represented by:

- `tabId`: browser tab id
- `windowId`: browser window id
- `parentTabId`: nullable parent reference
- `openerType`: classification label (`link`, `manual`, `external`, `unknown`)
- `createdAt`: ISO timestamp

Storage key:

- `tabTrees` in `browser.storage.local`

## 3) Event flow

### Capture

1. `tabs.onCreated`
2. If `openerTabId` exists, parent is known (`link`).
3. Else apply fallback policy from settings.
4. Write to in-memory map and schedule storage persist.

### Cleanup

1. `tabs.onRemoved`
2. Remove tab node.
3. Reparent direct children to removed node's parent.
4. Persist and notify UI listeners.

### UI updates

- Sidebar requests initial state via `runtime.sendMessage({ type: 'get-tree' })`.
- Background emits `tree-updated` messages after mutations.

## 4) Why sidebar-first

A tree interface benefits from vertical space and persistent visibility. Sidebar placement keeps traversal cognitive load low for long chains.

## 5) Known MVP limitations

- Classifying bookmark/manual/external opens is heuristic.
- No collapsed state persistence yet.
- No automated integration tests yet.

## 6) Near-term improvement strategy

1. Introduce deterministic lineage test cases.
2. Expand classification using additional browser events.
3. Refactor shared helpers (`src/config.js`, `src/state/treeStore.js`) into active runtime usage.
