/** @constant {Number} The total number of set-up parts */
var TOTAL_PARTS = 3;

/** {Number} The number of set-up parts done so far */
var partsDone = 0;

/** {ExtPay} Reference to the background ExtensionPay instance */
var extPay = chrome.extension.getBackgroundPage().extPay;

window.addEventListener("load", function () {
	checkMainExt();
	document.getElementById("permissionTestButton").addEventListener("click", initMicTest);
	checkPermission();
	document.getElementById("paymentButton").addEventListener("click", initPayment);
	checkPayment();
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
 * Check whether the microphone permission was already granted.
 * @returns {Promise}
 */
async function checkPermission() {
	var micActive = await checkMicActive(),
		permissionGranted = await checkMicPermission();
	if (micActive && permissionGranted) {
		handleStepDone("permission");
	}
}

/**
 * Set up a speech recognition instance to request/check speech recognition access.
 */
function initMicTest() {
	document.getElementById("permissionTestButton").disabled = true;
	
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
 * Check whether the user already paid to activate the extension.
 * @returns {Promise}
 */
async function checkPayment() {
	var user = await extPay.getUser();
	if (user.paid) {
		handleStepDone("payment");
	}
}

/**
 * Show the payment flow.
 */
function initPayment() {
	if (!navigator.onLine) {
		// Don't try to activate if offline.
		alert("You must be online to activate \u201cOK Google\u201d for Voice Actions for Chrome.");
		return;
	}
	
	// This adds the listener here and doesn't remove it because ExtensionPay doesn't support
	// removeListener yet, but it is unlikely someone would keep clicking the button enough times
	// to add a problematic number of listeners (unless something has gone wrong somewhere else).
	extPay.onPaid.addListener(checkPayment);
	extPay.openPaymentPage();
}

/**
 * Handle a set-up part being completed.
 * @param {String} stepElemID - The ID of the step's heading element, minus "Step"
 */
function handleStepDone(stepElemID) {
	// Visually mark the step as done.
	var stepElem = document.getElementById(stepElemID + "Step"),
		stepButton = stepElem.querySelector("button");
	if (stepElem.classList.contains("done")) {
		// If the step was already marked as done, don't do it again.
		return;
	}
	stepElem.classList.add("done");
	stepElem.querySelector(".stepNumber").setAttribute("aria-label", "Step completed.");
	if (stepButton) { stepButton.disabled = true; }
	
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
	var stepElem = document.getElementById(stepElemID + "Step"),
		stepButton = stepElem.querySelector("button");
	if (!stepElem.classList.contains("done")) {
		// If the step isn't marked as done, don't need to do anything.
		return;
	}
	stepElem.classList.remove("done");
	stepElem.querySelector(".stepNumber").removeAttribute("aria-label");
	if (stepButton) { stepButton.disabled = false; }
	
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
	chrome.extension.getBackgroundPage().init();
	
	// Close the set-up page.
	window.close();
}
