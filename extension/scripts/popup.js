/** {HTMLDivElement} The background fill for the delay when the action can be cancelled */
var loadIndicator;

/** {HTMLImageElement} The icon in the pop-up */
var iconElem;

/** {HTMLParagraphElement} The primary text in the pop-up */
var textElem;

/** {HTMLParagraphElement} The secondary text in the pop-up */
var subTextElem;

/** {Number} The id of the speech recognition tab */
var speechRecTabId;

window.addEventListener("load", function() {
	// Get references to DOM elements
	loadIndicator = document.getElementById("loadIndicator");
	iconElem = document.getElementById("icon");
	textElem = document.getElementById("text");
	subTextElem = document.getElementById("subtext");
	
	// Cancel event listeners.
	document.getElementById("cancelBtn").addEventListener("click", cancel, false);
	window.addEventListener("keydown", function(e) {
		if(e.keyCode === 27) {
			cancel();
		}
	}, false);
	window.addEventListener("unload", cancel, false);
	
	// Create a tab in which to do speech recognition.
	chrome.tabs.create({
		url: chrome.extension.getURL("speech_recognition.html"),
		active: false,
		index: 999999 // Big number to force the tab to the end of the row
	}, function(newTab) {
		speechRecTabId = newTab.id;
		chrome.tabs.sendMessage(newTab.id, {type: "start"});
	});
}, false);

chrome.extension.onMessage.addListener(function(message) {
	switch(message.type) {
		case "ready":
			promptSpeech();
			break;
		case "result":
			processResult(message.text);
			break;
		case "error":
			// Display error information, and then exit.
			displayError(message.text, message.subtext);
			delayAction(closePopup);
			break;
	}
});

/**
 * Indicate that speech recognition is ready and listening
 */
function promptSpeech() {
	// Prompt the user to speak.
	iconElem.src = ICON_URLS.mic;
	textElem.innerHTML = "Speak now";
	// If enabled, play a sound.
	playSound("start");
}

/**
 * Process the speech recognition result
 * @param {String} query - The query string to process
 */
async function processResult(query) {
	// If it is still open, close the speech recognition tab.
	if(speechRecTabId) {
		chrome.tabs.remove(speechRecTabId);
	}
	
	if(query === "I\'m feeling lucky") {
		// “I'm feeling lucky” => open most visited site
		openTopSite("<b>I'm feeling lucky</b>");
	} else if(query === "make me a sandwich") {
		iconElem.src = ICON_URLS.food;
		textElem.innerHTML = query.replace("make", "<b>make</b>");
		subTextElem.innerHTML = "What?  Make it yourself.";
		
		// If enabled, play an error sound.
		playSound("error");
	} else if(query === "sudo make me a sandwich" || query === "pseudo make me a sandwich") {
		// XKCD sudo easter egg
		query = query.replace("pseudo", "sudo"); // "sudo" gets recognized as "pseudo"; fix that
		iconElem.src = ICON_URLS.food;
		textElem.innerHTML = query.replace("make", "<b>make</b>");
		
		// If enabled, play a sound.
		playSound("end");
		
		delayAction(function() {
			openURL("http://xkcd.com/149");
		});
	} else if((/^close( this|( the)? current)? tab$/).test(query)) {
		// Close current tab
		iconElem.src = ICON_URLS.tabs;
		textElem.innerHTML = "<b>" + query + "</b>";
		
		// If enabled, play a sound.
		playSound("end");
		
		delayAction(function() {
			chrome.tabs.query({
				active: true,
				currentWindow: true
			}, function(tabs) {
				chrome.tabs.remove(tabs[0].id);
				closePopup();
			});
		});
	} else if(query.indexOf("switch to ") === 0) {
		// Switch to tab
		switchToTab(query.replace("switch to", "<b>switch to</b>"), query.replace("switch to ", ""));
	} else if(query.indexOf("map of ") === 0) {
		// Map
		openResult("map", query.replace("map of", "<b>map of</b>"), query.replace("map of ", ""));
	} else if(query.indexOf("directions to ") === 0) {
		// Directions
		openResult("directions", query.replace("directions to", "<b>directions to</b>"), query.replace("directions to ", ""));
	} else if(query.indexOf("calculate ") === 0) {
		// Calculator
		
		// If operators get captured as words, replace them (this
		// does not cover phrases like “the sum of ~ and ~”, but
		// it at least avoids the most basic issues).
		query = query.replace(/plus/g, "+").replace(/minus/g, "-").replace(/times/g, "*").replace(/divided by/g, "/").replace(/over/g, "/");
		
		openResult("calc", query.replace("calculate", "<b>calculate</b>"), query.replace("calculate ", ""));
	} else if(query.indexOf("image of ") === 0 || query.indexOf("images of ") === 0 ||
			query.indexOf("picture of ") === 0 || query.indexOf("pictures of ") === 0 ||
			query.indexOf("photo of ") === 0 || query.indexOf("photos of ") === 0 ||
			query.indexOf("pic of ") === 0 || query.indexOf("pics of ") === 0 ||
			query.indexOf("show me ") === 0) {
		// Pictures
		var action = "image of";
		if(query.indexOf("images of") === 0) {
			action = "images of";
		} else if(query.indexOf("picture of") === 0) {
			action = "picture of";
		} else if(query.indexOf("pictures of") === 0) {
			action = "pictures of";
		} else if(query.indexOf("photo of") === 0) {
			action = "photo of";
		} else if(query.indexOf("photos of") === 0) {
			action = "photos of";
		} else if(query.indexOf("pic of") === 0) {
			action = "pic of";
		} else if(query.indexOf("pics of") === 0) {
			action = "pics of";
		} else if(query.indexOf("show me") === 0) {
			action = "show me";
		}
		openResult("images", query.replace(action, "<b>" + action + "</b>"), query.replace(action + " ", ""));
	} else if(query.indexOf("video of ") === 0 || query.indexOf("videos of ") === 0 ||
			query.indexOf("movie of ") === 0 || query.indexOf("movies of ") === 0 ||
			query.indexOf("watch ") === 0) {
		// Videos
		var action = "video of";
		if(query.indexOf("videos of") === 0) {
			action = "videos of";
		} else if(query.indexOf("movie of") === 0) {
			action = "movie of";
		} else if(query.indexOf("movies of") === 0) {
			action = "movies of";
		} else if(query.indexOf("watch") === 0) {
			action = "watch";
		}
		openResult("videos", query.replace(action, "<b>" + action + "</b>"), query.replace(action + " ", ""));
	} else if(query.indexOf("listen to ") === 0 || query.indexOf("play ") === 0) {
		// Music
		var action = "listen to";
		if(query.indexOf("play") === 0) {
			action = "play";
		}
		
		// A music search for "dead mouse" is almost certainly meant to be "Deadmau5"
		query = query.replace(/dead mouse|dead mau 5/g, "deadmau5");
		
		openResult("music", query.replace(action, "<b>" + action + "</b>"), query.replace(action + " ", ""));
	} else if(query.indexOf("go to ") === 0 || query.indexOf("goto ") === 0 ||
			query.indexOf("open ") === 0 || query.indexOf("launch ") === 0) {
		// Load web page
		
		// This part searches the user's bookmarks for the page name.
		// It has been commented out because it does not consistently
		// return the correct page since it depends on the user having
		// the page in his/her bookmarks.  A better idea would be to
		// search the user's history (a feature I intend to add later).
		/*chrome.bookmarks.search(query.replace("go to ", "").replace("goto ", ""), function(results) {
			iconElem.src = ICON_URLS.web;
			textElem.innerHTML = query.replace(/^go ?to/, "<b>go to</b>").replace(/^open/, "<b>open</b>");
			delayAction(function() {
				if(results.length > 0) {
					openURL(results[0].url);
				} else {
					openURL("https://www.google.com/search?btnI=745&q=" + query);
				}
			});
		});*/
		var action = "go to";
		if(query.indexOf("goto") === 0) {
			action = "goto";
		} else if(query.indexOf("open") === 0) {
			action = "open";
		} else if(query.indexOf("launch") === 0) {
			action = "launch";
		}
		
		var launchSetting = await getSetting('launch'),
			disp = query.replace(action, "<b>" + action + "</b>");
		query = query.replace(action + " ", "");
		if(launchSetting === "chrome") {
			launchApp(disp, query, function() {
				displayError(disp, "No app with that title could be found.");
			});
		} else if(launchSetting === "google") {
			imFeelingLucky(disp, query);
		} else {
			launchApp(disp, query, function() {
				imFeelingLucky(disp, query);
			});
		}
	} else {
		// Default to simple search
		openResult("search", query, query);
	}
}

/**
 * Plays a sound if the user has sounds enabled.
 * @param {String} audioID - The ID of the audio element to play, minus the "Sound" suffix
 */
async function playSound(audioID) {
	var soundsSetting = await getSetting('sounds');
	if(soundsSetting) {
		document.getElementById(audioID + "Sound").play();
	}
}

/**
 * Displays error text in the pop-up
 * @param {String} errText - The primary error text (may include HTML)
 * @param {String} errSubText - The secondary error text (this may not be necessary and should only contain supplementary text)
 */
function displayError(errText, errSubText) {
	iconElem.src = ICON_URLS.error;
	textElem.innerHTML = errText || "An error occurred";
	subTextElem.textContent = errSubText || "";
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
	if(speechRecTabId) {
		chrome.tabs.remove(speechRecTabId);
	}
	window.close();
}