# Zen Nested Tab Trees

Zen Nested Tab Trees is a Firefox-compatible (and Zen-compatible) WebExtension that captures **how tabs were opened** and renders that relationship as a **parent/child tree**.

## Why this exists

Many browsing sessions are exploration chains, not isolated tabs.

- A tab opens from a search result.
- That tab opens reference tabs.
- Those references branch into more tabs.

Traditional tab strips preserve chronology and rough position, but they do not reliably preserve intent. This plugin treats tab navigation like a reasoning graph so users can work backward from where they are now to where they started.

## Project goals

1. Preserve context when opening new tabs.
2. Make rabbit-hole sessions traceable.
3. Keep organization emergent (automatic), not fully manual (workspace-only).
4. Stay compatible with Zen/Firefox extension APIs.
5. Be understandable and extendable by contributors.

## Current MVP capabilities

- Tracks tab parent-child lineage in the background script.
- Persists lineage to `browser.storage.local`.
- Reparents child tabs when parents close.
- Renders lineage in a sidebar tree UI.
- Provides options for fallback parent assignment.

## Repository structure

```text
.
├── manifest.json                # Extension registration + permissions
├── README.md                    # Project overview, setup, and roadmap
├── docs/
│   └── ARCHITECTURE.md          # Data model, event flow, and design rationale
└── src/
    ├── background.js            # Tab lineage capture + persistence + messaging
    ├── options/
    │   ├── options.html         # Settings UI
    │   └── options.js           # Settings load/save behavior
    ├── sidebar/
    │   ├── sidebar.html         # Sidebar shell
    │   ├── sidebar.css          # Tree styling
    │   └── sidebar.js           # Tree rendering + tab focus interactions
    ├── config.js                # Shared settings helpers (future refactor target)
    └── state/
        └── treeStore.js         # Shared store helpers (future refactor target)
```

## Reasoning chain (design choices)

- **Primary source of truth:** `tabs.onCreated` + `openerTabId`.
- **Gap handling:** when opener is absent, assign parent via configurable fallback policy.
- **State durability:** maintain in-memory map for speed, persist with debounced writes.
- **UX surface:** sidebar is preferred over popup because trees can grow deep.
- **Extensibility:** event-driven messaging (`get-tree`, `tree-updated`) enables future UI variants.

## First-run developer setup

1. Clone this repository.
2. Open Zen or Firefox.
3. Navigate to `about:debugging`.
4. Choose **This Firefox** (or Zen equivalent).
5. Select **Load Temporary Add-on**.
6. Choose this repo's `manifest.json`.

## First-run test build

This project currently uses a lightweight packaging check:

```bash
mkdir -p dist
zip -r dist/zen-nested-tab-trees.zip manifest.json src README.md docs
```

If the zip builds successfully, the extension files are structurally ready for temporary loading.

## Validation checks

```bash
python -m json.tool manifest.json
node --check src/background.js
node --check src/sidebar/sidebar.js
node --check src/options/options.js
```

## Roadmap

- Improve opener classification (bookmark/manual/external) using more browser signals.
- Add collapsed subtree state.
- Add ancestor-path highlighting.
- Add import/export snapshot of current tab tree.
- Add automated tests for lineage and reparenting behavior.

## Contributing

Contributors should start with `docs/ARCHITECTURE.md` to understand event flow and decisions before making behavior changes.
