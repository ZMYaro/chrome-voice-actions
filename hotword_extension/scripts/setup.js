/** @constant {String} The ID of the main Voice Actions for Chrome extension */
var VOICE_ACTIONS_EXT_ID = "hhpjefokaphndbbidpehikcjhldaklje";

/** @constant {Number} The total number of set-up parts */
var TOTAL_PARTS = 3;

/** {Number} The number of set-up parts done so far */
var partsDone = 0;

window.addEventListener("load", function () {
	checkMainExt();
	checkMicPermission();
	// TODO: Implement authentication
	handleStepDone("donation");
}, false);

/**
 * Check whether the main Voice Actions extension is installed and enabled.
 */
function checkMainExt() {
	chrome.management.get(VOICE_ACTIONS_EXT_ID, function (extInfo) {
		if (!extInfo || !extInfo.enabled) {
			// If the extension is not installed or enabled, keep the step open.
			return;
		}
		handleStepDone("mainExt");
	});
	chrome.management.onEnabled.addListener(function (extInfo) {
		if (extInfo.id !== VOICE_ACTIONS_EXT_ID) { return; }
		// If Voice Actions was enabled (which also gets triggered on
		// installation), mark the step as done.
		handleStepDone("mainExt");
	});
	chrome.management.onDisabled.addListener(function (extInfo) {
		if (extInfo.id !== VOICE_ACTIONS_EXT_ID) { return; }
		// If Voice Actions was disabled (which also gets triggered on
		// uninstallation), mark the step as done.
		handleStepUndone("mainExt");
	});
}

/**
 * Set up a speech recognition instance to request/check speech recognition access.
 */
function checkMicPermission() {
	// Create a speech recognition instance.
	var speechInput = new webkitSpeechRecognition();
	speechInput.continuous = false;
	speechInput.interimResults = false;
	// If speech recognition starts successfully, mark the step as done.
	speechInput.onstart = () => handleStepDone("permission");
	
	// Attempt to start speech recognition (and thus generate a permission prompt).
	speechInput.start();
}

/**
 * Handle a set-up part being completed.
 * @param {String} stepElemID - The ID of the step's heading element, minus "Step"
 */
function handleStepDone(stepElemID) {
	// Visually mark the step as done.
	var stepElem = document.getElementById(stepElemID + "Step");
	if (stepElem.classList.contains("done")) {
		// If the step was already marked as done, don't do it again.
		return;
	}
	stepElem.classList.add("done");
	stepElem.querySelector(".stepNumber").setAttribute("aria-label", "Step completed.");
	
	// If all parts are done, proceed.
	partsDone++;
	if (partsDone === TOTAL_PARTS) {
		handleAllDone();
	}
}

/**
 * Handel a step being undone.
 * @param {String} stepElemID - The ID of the step's heading element, minus "Step"
 */
function handleStepUndone(stepElemID) {
	// Visually mark the step as done.
	var stepElem = document.getElementById(stepElemID + "Step");
	if (!stepElem.classList.contains("done")) {
		// If the step isn't marked as done, don't need to do anything.
		return;
	}
	stepElem.classList.remove("done");
	stepElem.querySelector(".stepNumber").removeAttribute("aria-label");
	
	// If all parts are done, proceed.
	partsDone--;
}

/**
 * Handle all set-up parts being done.
 */
function handleAllDone() {
	// Save that the user completed set-up.
	chrome.storage.local.set({ setUp: true });
	
	// Go to the extension's options page now that permission has been granted.
	if (chrome.runtime && chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	} else {
		chrome.tabs.update({ url: chrome.extension.getURL("options_page.html") });
	}
	
	// Start listening now that permission has been granted.
	chrome.extension.getBackgroundPage().initHotwordListener();
	
	// Close the set-up page.
	window.close();
}
