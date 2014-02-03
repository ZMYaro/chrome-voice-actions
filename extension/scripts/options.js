window.addEventListener("load", function() {
	// Attempt to copy settings from localStorage to synced storage.
	copySettings();
	
	// Display the extension version number.
	document.getElementById("versionNumber").innerText =
		"Version " +
		chrome.runtime.getManifest().version;
	
	// Fetch all settings.
	chrome.storage.sync.get(defaultSettings, function(settings) {
		// For each setting,
		for(setting in settings) {
			// Get its form element.
			var formElem = document.getElementById(setting + "Setting");
			
			// Set its form element.
			if(formElem.tagName.toLowerCase() === "input" &&
					formElem.type.toLowerCase() === "checkbox") {
				formElem.checked = settings[setting];
			} else {
				formElem.value = settings[setting];
			}
			
			// Add an event listener to its form element.
			formElem.addEventListener("change", function(e) {
				// Set the corresponding setting based on
				if(e.target.tagName.toLowerCase() === "input" &&
						e.target.type.toLowerCase() === "checkbox") {
					// Whether the element is checked (if it is a checkbox).
					setSetting(e.target.id.replace("Setting", ""), e.target.checked);
				} else {
					// The element's value (if it is a normal form element).
					setSetting(e.target.id.replace("Setting", ""), e.target.value);
				}
			}, false);
			
			// Enable its form element.
			formElem.disabled = false;
		}
	});
	
	// Add reset button event listener.
	document.getElementById("resetButton").addEventListener("click", function(e) {
		if(confirm("Are you sure you want to reset all your settings?  This cannot be undone!")) {
			chrome.storage.sync.clear();
			location.reload();
		}
	});
	// Enable the reset button.
	document.getElementById("resetButton").disabled = false;
	
	// Create a speech recognition instance.
	var speechInput = new webkitSpeechRecognition();
	speechInput.continuous = false;
	speechInput.interimResults = false;
	// Add an event listener for when speech recognition starts successfully.
	speechInput.onstart = function(e) {
		// At this point, the omnibox media icon should be displayed.  There is
		// no need for speech recognition to continue, so abort it.
		e.target.abort();
	};
	// Attempt to start speech recognition (and, as a result, display the omnibox media icon).
	speechInput.start();
}, false);

function setSetting(setting, value) {
	var newSettingObj = {};
	newSettingObj[setting] = value;
	chrome.storage.sync.set(newSettingObj, function() {
		if(chrome.runtime.lastError) {
			alert("Something went wrong: " + chrome.runtime.lastError);
		}
	});
}