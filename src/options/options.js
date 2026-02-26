const DEFAULT_SETTINGS = {
  bookmarkOpenBehavior: "newRoot",
  manualOpenBehavior: "attachToActive",
  externalOpenBehavior: "attachToLastActive"
};

async function loadSettings() {
  const stored = await browser.storage.local.get("settings");
  return {
    ...DEFAULT_SETTINGS,
    ...(stored.settings || {})
  };
}

async function saveSettings() {
  const settings = {
    bookmarkOpenBehavior: document.getElementById("bookmarkOpenBehavior").value,
    manualOpenBehavior: document.getElementById("manualOpenBehavior").value,
    externalOpenBehavior: document.getElementById("externalOpenBehavior").value
  };

  await browser.storage.local.set({ settings });
  await browser.runtime.sendMessage({ type: "settings-updated" });

  const status = document.getElementById("status");
  status.textContent = "Saved.";
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
}

(async function init() {
  const settings = await loadSettings();

  document.getElementById("bookmarkOpenBehavior").value = settings.bookmarkOpenBehavior;
  document.getElementById("manualOpenBehavior").value = settings.manualOpenBehavior;
  document.getElementById("externalOpenBehavior").value = settings.externalOpenBehavior;

  document.getElementById("save").addEventListener("click", saveSettings);
})();
