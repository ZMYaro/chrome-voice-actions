chrome.runtime.onInstalled.addListener(function(details) {
	// Only show the page on first install.
	if(details.reason === "install") {
		chrome.tabs.create({url: chrome.extension.getURL("permission.html")});
	}
});