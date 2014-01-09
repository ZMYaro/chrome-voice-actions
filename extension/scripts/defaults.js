var defaultSettings = {
	"search":"google",
	"images":"google",
	"videos": "youtube",
	"map":"google",
	"directions":"google",
	"web":"google",
	"music":"google",
	"calc":"wolframalpha",
	
	"actionDelayTime": 2050,
	"openLocation":"smart"
}

/**
 * Copy options from localStorage to synced storage
 */
function copySettings() {
	// Create an object to hold the settings.
	var settingsToCopy = {};
	// For each setting,
	for(setting in defaultSettings) {
		// If it is set in localStorage,
		if(localStorage[setting + "Setting"]) {
			// Copy it to the temporary object.
			settingsToCopy[setting] = localStorage[setting + "Setting"];
		}
	}
	// If there were settings in localStorage,
	if(Object.keys(settingsToCopy).length) {
		// Attempt to save the settings to sync storage.
		chrome.storage.sync.set(settingsToCopy, function() {
			// If nothing went wrong,
			if(!chrome.runtime.lastError) {
				// Delete each setting from localStorage.
				for(setting in defaultSettings) {
					delete localStorage[setting + "Setting"];
				}
			}
		});
	}
}