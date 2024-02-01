window.addEventListener("load", function () {
	// Attempt to copy settings from localStorage to synced storage.
	copySettings();
	
	// Run the Options Page Boilerplate link set-up function for the embedded options page.
	setUpChromeLinks();
	
	// Display the extension version number.
	document.getElementById("versionNumber").textContent =
		"Version " +
		chrome.runtime.getManifest().version;
	
	// Fetch all settings.
	chrome.storage.sync.get(DEFAULT_SETTINGS, function (settings) {
		// For each setting,
		for (setting in settings) {
			// Get its form element.
			var formElem = document.getElementById(setting + "Setting");
			
			// Set its form element.
			if (formElem.tagName.toLowerCase() === "input" &&
					formElem.type.toLowerCase() === "checkbox") {
				formElem.checked = settings[setting];
			} else {
				formElem.value = settings[setting];
			}
			
			// Add an event listener to its form element.
			formElem.addEventListener("change", function (e) {
				// Set the corresponding setting based on
				if (e.target.tagName.toLowerCase() === "input" &&
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
		
		// Disabled I'm Feeling Lucky menu if applicable.
		document.getElementById("imFeelingLuckySetting").disabled = (settings.launch === "chrome");
		// Show system theme bug warning if applicable.
		document.getElementById("systemThemeCrbugWarning").style.display =
			(settings.toolbarColorScheme === "default") ? "block" : "none";
	});
	
	// Show current keyboard shortcut.
	chrome.commands.getAll(function (commands) {
		var command = commands.filter(function (el) { return el.name === "_execute_browser_action"; })[0],
			shortcutText = (!command || !command.shortcut) ? "[no shortcut set]" : command.shortcut;
		document.getElementById("currentKeyboardShortcut").textContent = shortcutText;
	});
	
	// Show hotword extension status.
	chrome.management.get(HOTWORD_EXT_ID, function (extInfo) {
		if (!extInfo || !extInfo.enabled) {
			// If the extension is not installed or enabled, keep the step open.
			return;
		}
		document.getElementById("hotwordInstallHint").style.display = "none";
		document.getElementById("hotwordInstalledHint").style.removeProperty("display");
	});
	chrome.management.onEnabled.addListener(function (extInfo) {
		if (extInfo.id !== HOTWORD_EXT_ID) { return; }
		// If the hotword extension was enabled (which also gets triggered
		// on installation), mark the step as done.
		document.getElementById("hotwordInstallHint").style.display = "none";
		document.getElementById("hotwordInstalledHint").style.removeProperty("display");
	});
	chrome.management.onDisabled.addListener(function (extInfo) {
		if (extInfo.id !== HOTWORD_EXT_ID) { return; }
		// If the hotword extension was disabled (which also gets triggered
		// on uninstallation), mark the step as done.
		document.getElementById("hotwordInstalledHint").style.display = "none";
		document.getElementById("hotwordInstallHint").style.removeProperty("display");
	});
	
	// Set up enabling/disabling I'm Feeling Lucky setting.
	document.getElementById("launchSetting").addEventListener("input", function (e) {
		document.getElementById("imFeelingLuckySetting").disabled = (e.target.value === "chrome");
	});
	
	// Set up showing/hiding system theme bug warning.
	document.getElementById("toolbarColorSchemeSetting").addEventListener("input", function (e) {
		document.getElementById("systemThemeCrbugWarning").style.display =
			(e.target.value === "default") ? "block" : "none";
	});
	
	// Add reset button event listener.
	document.getElementById("resetButton").addEventListener("click", function (e) {
		// `confirm` cannot be called from the embedded options page.
		var resetConfirmed =
			chrome.extension.getBackgroundPage().confirm(
				"Are you sure you want to reset all your settings?  This cannot be undone!");
		
		if (!resetConfirmed) {
			return;
		}
		
		chrome.storage.sync.clear();
		location.reload();
	});
	// Enable the reset button.
	document.getElementById("resetButton").disabled = false;
	
	// Create a speech recognition instance.
	var speechInput = new webkitSpeechRecognition();
	speechInput.continuous = false;
	speechInput.interimResults = false;
	// Add an event listener for when speech recognition starts successfully.
	speechInput.onstart = function (e) {
		// At this point, the omnibox media icon should be displayed.  There is
		// no need for speech recognition to continue, so abort it.
		e.target.abort();
	};
	// Attempt to start speech recognition (and, as a result, display the omnibox media icon).
	speechInput.start();
}, false);

/**
 * Save a new setting value to synced storage.
 * @param {String} setting
 * @param {Array|Boolean|Number|String} value
 * @returns {Promise} Resolves when the setting has been saved
 */
function setSetting(setting, value) {
	return new Promise(function (resolve, reject) {
		var newSettingObj = {};
		newSettingObj[setting] = value;
		chrome.storage.sync.set(newSettingObj, function () {
			if (chrome.runtime.lastError) {
				alert("Something went wrong: " + chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
				return
			}
			resolve();
		});
	});
}

// Copied from the Options Page Boilerplate for use on the embedded options page.
/**
 * Change any chrome:// link to use the goToPage function
 */
function setUpChromeLinks() {
	// Get the list of <a>s whose links begin with “chrome://”.
	var links = document.querySelectorAll('a[href^=\"chrome://');
	for(var i = 0; i < links.length; i++) {
		// Tell each Chrome page link to use the override function.
		links[i].onclick = goToPage;
	}
}
/**
 * Use chrome.tabs.update to open a link Chrome will not open normally
 */
function goToPage(e) {
	// Prevent the browser from following the link.
	e.preventDefault();
	if (e.target.target === "_blank") {
		chrome.tabs.create({ url: e.target.href });
	} else {
		chrome.tabs.update({ url: e.target.href });
	}
}
