const DEFAULT_SETTINGS = {
  bookmarkOpenBehavior: "newRoot",
  manualOpenBehavior: "attachToActive",
  externalOpenBehavior: "attachToLastActive"
};

async function getSettings() {
  const stored = await browser.storage.local.get("settings");
  return {
    ...DEFAULT_SETTINGS,
    ...(stored.settings || {})
  };
}

async function updateSettings(partial) {
  const next = {
    ...(await getSettings()),
    ...partial
  };
  await browser.storage.local.set({ settings: next });
  return next;
}

if (typeof module !== "undefined") {
  module.exports = {
    DEFAULT_SETTINGS,
    getSettings,
    updateSettings
  };
}
