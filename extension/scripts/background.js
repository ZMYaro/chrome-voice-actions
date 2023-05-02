chrome.runtime.onInstalled.addListener(function (details) {
	// Only show the page on first install.
	if (details.reason === "install") {
		chrome.tabs.create({ url: chrome.extension.getURL("permission.html") });
	}
	// Attempt to copy settings from localStorage to synced storage.
	copySettings();
	// Set the icon color in case the user customized it on a synced account (or the extension was refreshed).
	getSetting("toolbarIcon").then(setIcon);
});

// Attempt to copy settings from localStorage to synced storage.
chrome.runtime.onStartup.addListener(copySettings);
