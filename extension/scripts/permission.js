window.addEventListener("load", function() {
	// Create a speech recognition instance.
	var speechInput = new webkitSpeechRecognition();
	speechInput.continuous = false;
	speechInput.interimResults = false;
	// Add an event listener for when speech recognition (hopefully) starts successfully.
	speechInput.onstart = recognitionStarted;
	
	// Attempt to start speech recognition (and thus generate a permission prompt).
	speechInput.start();
}, false);

/**
 * Called when speech recognition has begun
 */
function recognitionStarted() {
	// Go to the extension's options page now that permission has been granted.
	chrome.tabs.update({url: chrome.extension.getURL("options.html")});
}