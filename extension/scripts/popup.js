/** @constant {Number} The default window width, in ems */
var WINDOW_WIDTH = 10;

/** {HTMLDivElement} The background fill for the delay when the action can be cancelled */
var loadIndicator;

/** {HTMLImageElement} The icon in the pop-up */
var iconElem;

/** {HTMLParagraphElement} The primary text in the pop-up */
var textElem;

/** {HTMLParagraphElement} The secondary text in the pop-up */
var subTextElem;

window.addEventListener("load", function () {
	// Get references to DOM elements
	loadIndicator = document.getElementById("loadIndicator");
	iconElem = document.getElementById("icon");
	textElem = document.getElementById("text");
	subTextElem = document.getElementById("subtext");
	
	// Cancel event listeners.
	document.getElementById("cancelBtn").addEventListener("click", cancel, false);
	window.addEventListener("keydown", function (e) {
		if (e.keyCode === 27) {
			cancel();
		}
	}, false);
	window.addEventListener("unload", cancel, false);
	
	// Close any orphaned past speech recognition tabs.
	cleanUpSpeechRecTabs();
	
	// Run the function that will set up speech recognition in the pop-up
	// or fall back to a speech recognition tab if necessary.
	setUpRecognition();
}, false);

chrome.extension.onMessage.addListener(function (message) {
	switch (message.type) {
		case "ready":
			promptSpeech();
			break;
		case "result":
			processQuery(message.text);
			break;
		case "error":
			// Display error information, and then exit.
			displayError(message.text, message.subtext);
			delayAction(closePopup);
			break;
	}
});

/**
 * Create a new tab for handling speech recognition and send it a message to start.
 */
function createSpeechRecTab() {
	// Create a tab in which to do speech recognition.
	chrome.tabs.create({
		url: chrome.extension.getURL("speech_recognition.html"),
		active: false,
		index: 999999 // Big number to force the tab to the end of the row
	}, function (newTab) {
		chrome.tabs.sendMessage(newTab.id, { type: "start" });
	});
}

/**
 * Indicate that speech recognition is ready and listening
 */
function promptSpeech() {
	// Prompt the user to speak.
	iconElem.src = ICON_URLS.mic;
	displayText("Speak now");
	// If enabled, play a sound.
	playSound("start");
}

async function processQuery(query) {
	// Close the speech recognition tab.
	cleanUpSpeechRecTabs();
	
	displayText("Processing...");
	
	// Create variables for the displayed response, which can be modified by a custom handler.
	var disp = {
		text: '',
		subText: ''
	};
	
	for (var [actionID, params] of Object.entries(ACTIONS)) {
		var regexResult = query.match(params.regex);
		if (!regexResult) {
			// If no match for this action, check the next one.
			continue;
		}
		
		// The first capture group should be the keyword for the action.
		var keyword = regexResult[1] || '';
		// By default, display the query with the keyword bolded.
		disp.text = query.replace(keyword, '<b>' + keyword + '</b>');
		query = query.replace(keyword, '').trim();
		
		// If there is a custom handler, run it.
		if (params.handler) {
			try {
				await params.handler(query, disp);
			} catch (err) {
				// If it throws, display the error text as the sub-text is the pop-up and abort.
				displayError(disp.text, err);
				return;
			}
		} else {
			// If there is no custom handler, assume it is a regular search action.
			handleSearchAction(actionID, query);
		}
		
		// Show the action's icon, text, and sub-text, and play its sound if enabled.
		iconElem.src = params.icon || ICON_URLS[actionID];
		displayText(disp.text, disp.subText);
		playSound(params.sound || "end");
		break;
	}
}

/**
 * Plays a sound if the user has sounds enabled.
 * @param {String} audioID - The ID of the audio element to play, minus the "Sound" suffix
 */
async function playSound(audioID) {
	var soundsSetting = await getSetting('sounds');
	if (soundsSetting) {
		document.getElementById(audioID + "Sound").play();
	}
}

/**
 * Display text in the pop-up.
 * @param {String} text - The primary text (may include HTML)
 * @param {String} [subText] - The secondary text (generally unnecessary and should only contain supplementary text)
 */
function displayText(text, subText) {
	textElem.innerHTML = text;
	subTextElem.textContent = subText || "";
	
	// In case the popup is a resizable window, ensure it can fit the text.
	var windowChromeWidth = (window.outerWidth - document.documentElement.clientWidth),
		windowChromeHeight = (window.outerHeight - document.documentElement.clientHeight),
		windowWidth = WINDOW_WIDTH * parseInt(getComputedStyle(document.body)['font-size']);
	window.resizeTo(
		windowWidth + windowChromeWidth,
		document.body.offsetHeight + windowChromeHeight);
}

/**
 * Display error text in the pop-up
 * @param {String} errText - The primary error text (may include HTML)
 * @param {String} errSubText - The secondary error text (generally unnecessary and should only contain supplementary text)
 */
function displayError(errText, errSubText) {
	iconElem.src = ICON_URLS.error;
	displayText(errText || "An error occurred", errSubText);
	// If enabled, play a sound.
	playSound("error");
}

/**
 * Cancels speech recognition and closes the pop-up.
 */
function cancel() {
	// If enabled, play a sound.
	playSound("cancel");
	closePopup();
}

/**
 * Closes the speech recognition tab, if any, and then closes the pop-up.
 */
function closePopup() {
	cleanUpSpeechRecTabs();
	window.close();
}

/**
 * Close any open speech recognition tabs.
 */
function cleanUpSpeechRecTabs() {
	var speechRecPageURL = chrome.runtime.getURL("speech_recognition.html");
	chrome.tabs.query({ url: speechRecPageURL }, function (tabs) {
		tabs.forEach(function (tab) {
			chrome.tabs.remove(tab.id);
		});
	});
}
