# Zen Nested Tab Trees

A Firefox-compatible (Zen-compatible) WebExtension that records tab parent-child lineage and renders it as a navigable tree in a sidebar.

## Why this exists (reasoning chain)

Browsers are great at opening tabs quickly, but poor at preserving the *intent chain* behind those tabs.

Typical failure mode:
1. You start with one question.
2. Open links in new tabs and branch into subtopics.
3. A few unrelated opens (bookmark/manual/external) interrupt the sequence.
4. The raw tab strip order no longer tells the story of your thinking.

This extension aims to preserve that story by:
- Treating each tab as a node in a parent/child graph.
- Using `openerTabId` when available for high-confidence parent links.
- Applying configurable fallback policies when parent metadata is missing.
- Rendering the resulting structure as a tree so users can walk backwards through exploration.

## MVP features

- Capture tab lineage in a background script.
- Persist lineage in `browser.storage.local`.
- Reparent child tabs when a parent closes.
- Sidebar tree UI for quick navigation to any node.
- Options page for fallback lineage behavior.

## Current architecture

### Extension entrypoints
- `manifest.json` — extension wiring for background script, sidebar, and options.
- `src/background.js` — source of truth for tree state + event handlers.
- `src/sidebar/` — tree visualization and tab activation interactions.
- `src/options/` — settings editor for ambiguous parent assignment.

### Data model
Each tracked tab is stored as:

```js
{
  tabId,
  windowId,
  parentTabId,
  openerType, // "link" | "manual" | "external" | "unknown"
  createdAt
}
```

### Event flow
1. `tabs.onCreated` fires.
2. Parent is selected from:
   - `tab.openerTabId`, else
   - configured fallback rule.
3. State is persisted (debounced) to storage.
4. Sidebar is notified via runtime message (`tree-updated`).
5. `tabs.onRemoved` reparents children to preserve continuity.

## Fallback policy behavior

- **Manual opens** (`about:blank` by default heuristic):
  - `attachToActive` or `newRoot`
- **External/unknown opens**:
  - `attachToLastActive` or `newRoot`
- **Bookmark behavior setting** is present in options UI for planned classification work.

## First-run build/test workflow

### 1) Validate manifest and JavaScript syntax
```bash
python -m json.tool manifest.json >/dev/null
node --check src/background.js
node --check src/sidebar/sidebar.js
node --check src/options/options.js
```

### 2) Build distributable zip (local)
```bash
mkdir -p dist
zip -r dist/zen-nested-tab-trees.zip manifest.json src README.md LICENSE
```

### 3) Load extension in Zen/Firefox
1. Open `about:debugging`.
2. Go to **This Firefox** (or Zen equivalent).
3. Click **Load Temporary Add-on**.
4. Select `manifest.json`.

## Repository structure

```text
.
├── manifest.json
├── README.md
├── LICENSE
└── src
    ├── background.js
    ├── config.js
    ├── state
    │   └── treeStore.js
    ├── sidebar
    │   ├── sidebar.html
    │   ├── sidebar.css
    │   └── sidebar.js
    └── options
        ├── options.html
        └── options.js
```

## Roadmap (next improvements)

- Detect bookmark/manual/external opens with better classification signals.
- Collapse/expand subtrees and ancestor highlighting.
- Optional session snapshots to complement browser history.
- Export/import lineage for collaboration and debugging.

## Contributing guidance

If you extend behavior, please include:
- Which event/path you changed (tab created, removed, restored, moved, etc.).
- Any new parent selection rule.
- How the change affects backward traceability for the user.

That keeps the project aligned with the core goal: preserving reasoning trails while browsing.
