/** @constant {String} The ID of the main Voice Actions for Chrome extension */
var VOICE_ACTIONS_EXT_ID = "hhpjefokaphndbbidpehikcjhldaklje";

/** @constant {String} The URL of the Voice Actions for Chrome pop-up */
var VOICE_ACTIONS_POPUP_URL = "chrome-extension://" + VOICE_ACTIONS_EXT_ID + "/popup.html";

/** @constant {RegExp} Matches “OK Chrome” or “Hey, Chrome” being the last words said */
var HOTWORD_REGEX = /(ok|okay|hey) chrome$/i;

/** @constant {String} JSGF grammar definition for the hotword listener */
var HOTWORD_GRAMMAR =
		"#JSGF V1.0;" +
		"grammar hotwords;" +
		"public <hotword> = ( ok chrome | okay chrome | hey chrome );";

/** @constant {Object<String,Number>} Stata speech recognition can be in */
var SPEECH_REC_STATA = {
	notHandled: 0,
	dontAutoRestart: 1,
	restartASAP: 2,
	restartAfterDelay: 3
};

/** @constant {Number} Minimum time to wait between restart attempts, in milliseconds */
var MIN_RESTART_ATTEMPT_DELAY = 1000;

/** @constant {Number} Time to wait after speech recognition is aborted before restarting, in milliseconds */
var POST_ABORT_RESTART_DELAY = 10000;

/** @constant {Object<String,String>} Tooltip messages, including defaults for the 3 icon states */
var TOOLTIPS = {
	active: "Listening for \u201cOK Chrome\u201d",
	inactive: "Listening paused",
	error: "An error occurred",
	offline: "Offline"
};

/** @constant {Object<String,Number>} The dimensions of the pop-up window to open with the hotword, in pixels */
var POPUP_DIMENSIONS = { width: 160, height: 180 };
// TODO: Make this adapt to non-default font sizes.

/** @constant {Number} How far from the edge of the screen to spawn the pop-up */
var POPUP_MARGIN = 16;

/** {SpeechRecognition} The speech recognition object exclusively for listening for the hotword */
var speechInput;

/** {Number} Timestamp of the last attempt to start hotword speech recognition */
var lastSpeechRecStartTime = 0;

/** {Boolean} The status of speech recognition being processed */
var speechRecStatus = SPEECH_REC_STATA.notHandled;

/** {Number} ID of the last focused regular browser window */
var lastFocusedWindowID = chrome.windows.WINDOW_ID_CURRENT; // Necessary because of https://crbug.com/546696.

/** {Number} ID of the last pop-up window opened */
var popupWindowID;

chrome.runtime.onInstalled.addListener(function (details) {
	// Show the set-up page on first install.
	if (details.reason === "install") {
		chrome.tabs.create({ url: chrome.extension.getURL("setup.html") });
	}
});

// If the extension has been set up, automatically start.
chrome.storage.local.get({ setUp: false }, function (items) {
	if (items.setUp) {
		initHotwordListener();
	} else {
		setToolbarIcon("inactive", "Not set up");
	}
})

function initHotwordListener() {
	setToolbarIcon("inactive");
	
	// Create speech recognition object.
	speechInput = new webkitSpeechRecognition();
	speechInput.continuous = true;
	speechInput.interimResults = false;
	
	var hotwordGrammars = new webkitSpeechGrammarList();
	hotwordGrammars.addFromString(HOTWORD_GRAMMAR);
	speechInput.grammars = hotwordGrammars;
	
	// Set speech API event listeners.
	speechInput.onstart = handleSpeechRecStart;
	speechInput.onerror = handleSpeechRecError;
	speechInput.onresult = handleSpeechRecResult;
	speechInput.onend = handleSpeechRecEnd;
	
	// If the toolbar button is clicked, attempt to restart speech recognition.
	chrome.browserAction.onClicked.addListener(startListeningForHotword);
	
	// If the device goes offline, attempt to restart speech recognition when it comes back online.
	// (No offline listener because, if the browser doesn't support offline speech
	// recognition, it will get caught by the speech recognition error handler.)
	window.addEventListener("online", startListeningForHotword);
	
	// Start listening!
	startListeningForHotword();
}

/**
 * Start listening for the hotword if speech recognition is not already running.
 */
function startListeningForHotword() {
	// Don't make multiple restart attempts too frequently.
	var timeSinceLastStart = (new Date()).getTime() - lastSpeechRecStartTime;
	if (timeSinceLastStart < MIN_RESTART_ATTEMPT_DELAY) {
		setTimeout(startListeningForHotword, MIN_RESTART_ATTEMPT_DELAY - timeSinceLastStart);
		return;
	}
	lastSpeechRecStartTime = (new Date()).getTime();
	
	speechRecStatus = SPEECH_REC_STATA.notHandled;
	
	// Start speech recognition if not already running.
	try {
		speechInput.start();
	} catch (err) {
		// If already running, don't do anything.
	}
}

/**
 * Handle speech recognition having begun
 */
function handleSpeechRecStart() {
	setToolbarIcon("active");
}

/**
 * Handle unsuccessful speech recognition
 * @param {SpeechRecognitionError} e - The recognition error
 */
function handleSpeechRecError(e) {
	setToolbarIcon("inactive");
	
	switch (e.error) {
		case "aborted":
			// If speech recognition was aborted by something other than this extension
			// (often due to speech recognition happening elsewhere), wait and then restart.
			if (speechRecStatus === SPEECH_REC_STATA.notHandled) {
				speechRecStatus = SPEECH_REC_STATA.restartAfterDelay;
			} else {
				speechRecStatus = SPEECH_REC_STATA.dontAutoRestart;
			}
			return;
		case "no-speech":
			// If speech recognition gave up, restart without showing the error state.
			speechRecStatus = SPEECH_REC_STATA.restartASAP;
			return;
		case "not-allowed":
		case "service-not-allowed":
			// If there was a potential permission error, open the set-up page.
			chrome.tabs.create({ url: chrome.extension.getURL("setup.html") });
			speechRecStatus = SPEECH_REC_STATA.dontAutoRestart;
			break;
		case "network":
			if (!navigator.onLine) {
				// If the device is offline, show a non-error inactive status.
				setToolbarIcon("inactive", TOOLTIPS.offline);
				speechRecStatus = SPEECH_REC_STATA.dontAutoRestart;
				return;
			}
			// If there was a different network-related error, try to restart, but
			// still show the error in the meantime.
			speechRecStatus = SPEECH_REC_STATA.restartASAP;
			break;
		default:
			// If it was not a known error, attempt to restart after showing the error state.
			speechRecStatus = SPEECH_REC_STATA.restartASAP;
	}
	
	// If an error handler didn't return, show the error state on the toolbar icon.
	var errorText = TOOLTIPS.error;
	if (e.error) {
		errorText += ": " + e.error.replace(/-/g, " ");
	}
	setToolbarIcon("error", errorText);
}

/**
 * Handle successful speech recognition
 * @param {SpeechRecognitionEvent} e - The speech recognition result event
 */
function handleSpeechRecResult(e) {
	// If the hotword wasn't said, don't do anything with this result.
	if (e.results.length === 0 || !e.results[e.resultIndex][0].transcript.match(HOTWORD_REGEX)) {
		return;
	}
	
	setToolbarIcon("inactive");
	
	if (typeof popupWindowID !== "undefined") {
		// If a previous pop-up might still be open, close it.
		chrome.windows.remove(popupWindowID);
	}
	
	// If the hotword WAS said, open the Voice Actions pop-up.
	// (In a dialog window because extensions aren't allowed
	// to programmatically open toolbar pop-ups.)
	
	// First bring the last focused window to the front if it isn't already.
	chrome.windows.update(lastFocusedWindowID, { focused: true }, function () {
		// Open the voice actions pop-up, and inform it which window it should be tied to.
		chrome.windows.create({
			type: "popup",
			focused: true,
			left: window.screen.width - POPUP_DIMENSIONS.width - POPUP_MARGIN,
			top: POPUP_MARGIN,
			width: POPUP_DIMENSIONS.width,
			height: POPUP_DIMENSIONS.height,
			url: VOICE_ACTIONS_POPUP_URL + "?last-focused-window-id=" + lastFocusedWindowID
		}, function (popupWindow) {
			// Save the pop-up window ID to detect when it is closed.
			popupWindowID = popupWindow.id;
		});
	});
	
	speechRecStatus = SPEECH_REC_STATA.dontAutoRestart;
}

/**
 * Handle speech recognition ending, regardless of result.
 */
function handleSpeechRecEnd(e) {
	switch (speechRecStatus) {
		case SPEECH_REC_STATA.dontAutoRestart:
			return;
		case SPEECH_REC_STATA.restartAfterDelay:
			setTimeout(startListeningForHotword, POST_ABORT_RESTART_DELAY);
			return;
		case SPEECH_REC_STATA.restartASAP:
		default:
			// If speech recognition ended in a way that wasn't handled by any other handler, restart.
			startListeningForHotword();
	}
}

chrome.windows.onRemoved.addListener(function (windowID) {
	// Restart listening when the pop-up is closed.
	if (windowID === popupWindowID) {
		popupWindowID = undefined;
		startListeningForHotword();
	}
}, {
	windowTypes: ["popup"]
});

// Workaround for https://crbug.com/546696.
chrome.windows.onFocusChanged.addListener(function (windowID) {
	if (windowID === chrome.windows.WINDOW_ID_NONE) { return; }
	lastFocusedWindowID = windowID;
}, {
	windowTypes: ['normal']
});

/**
 * Set the toolbar icon.
 * @param {String} status - "active", "inactive", or "error"
 * @param {String} [text] - The tooltip text, if any
 */
function setToolbarIcon(status, text) {
	chrome.browserAction.setIcon({
		path: {
			16: "../images/icon_" + status + "_16.png",
			19: "../images/icon_" + status + "_19.png",
			32: "../images/icon_" + status + "_32.png",
			38: "../images/icon_" + status + "_38.png"
		}
	});
	chrome.browserAction.setTitle({
		title: text || TOOLTIPS[status]
	});
}
