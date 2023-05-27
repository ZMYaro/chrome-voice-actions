chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason === "install") {
		// On first install, open the permission prompt page.
		chrome.tabs.create({ url: chrome.extension.getURL("permission.html") });
	} else if (details.reason === "update") {
		showUpdatePageIfNew(details);
	}
	
	// Attempt to copy settings from localStorage to synced storage.
	copySettings();
	// Set the icon color in case the user customized it on a synced account (or the extension was refreshed).
	getSetting("toolbarIcon").then(setToolbarIcon);
});

/**
 * Show the update page if it hasn't been shown for this version.
 * @returns {Promise}
 */
async function showUpdatePageIfNew(installDetails) {
	var currentVersion = parseFloat(chrome.runtime.getManifest().version),
		previousVersion = parseFloat(installDetails.previousVersion),
		lastUpdateShown = await getSetting("lastUpdateShown", 0.1, "local");
	
	if (previousVersion >= currentVersion || lastUpdateShown >= currentVersion) {
		// If the update isn't a new version, don't show the update page.
		return;
	}
	
	// Open the update page.
	chrome.tabs.create({ url: chrome.extension.getURL("update.html") });
	chrome.storage.local.set({ lastUpdateShown: currentVersion });
}

// Attempt to copy settings from localStorage to synced storage.
chrome.runtime.onStartup.addListener(copySettings);
