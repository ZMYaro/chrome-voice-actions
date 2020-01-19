/** {HTMLImageElement} The icon in the pop-up */
var icon;

/** {HTMLParagraphElement} The primary text in the pop-up */
var text;

/** {HTMLParagraphElement} The secondary text in the pop-up */
var subtext;

/** {Number} The id of the speech recognition tab */
var speechRecTabId;

window.addEventListener("load", function() {
	chrome.storage.sync.get({
		actionDelayTime: defaultSettings.actionDelayTime
	}, function(settings) {
		document.body.style.WebkitTransitionDuration =
			document.body.style.transitionDuration = Math.floor(settings.actionDelayTime / 1000) + "s";
	});
	
	// Cancel event listeners.
	document.getElementById("cancelBtn").addEventListener("click", cancel, false);
	window.addEventListener("keydown", function(e) {
		if(e.keyCode === 27) {
			cancel();
		}
	}, false);
	window.addEventListener("unload", cancel, false);
	
	// Get references to DOM elements
	icon = document.getElementById("icon");
	text = document.getElementById("text");
	subtext = document.getElementById("subtext");
	
	// Create a tab in which to do speech recognition.
	chrome.tabs.create({
		url: chrome.extension.getURL("speech_recognition.html"),
		active: false,
		index: 999999 // Big number to force the tab to the end of the row
	}, function(newTab) {
		speechRecTabId = newTab.id;
		chrome.tabs.sendMessage(newTab.id, {type: "start"});
	});
	
	/*
	// Get the current tab.
	chrome.tabs.query({"currentWindow":true, "active":true}, function(tabs) {
		// Display an error if the current page is a Chrome page.
		if(tabs[0].url.indexOf("chrome://") === 0 ||
				(tabs[0].url.indexOf("chrome-extension://") === 0 &&
				tabs[0].url.indexOf(chrome.extension.getURL("")) !== 0) ||
				tabs[0].url.indexOf("https://chrome.google.com/webstore") === 0) {
			displayError("Please switch to a different tab", "Voice actions do not work on Chrome pages yet.");
		} else { // Otherwise attempt to do speech recognition.
			chrome.tabs.sendMessage(tabs[0].id, {type: "start"});
		}
	});*/
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
	icon.src = "images/mic.png";
	text.innerHTML = "Speak now";
	// If enabled, play a sound.
	playSound("startSound");
}

/**
 * Process the speech recognition result
 * @param {String} query - The query string to process
 */
function processResult(query) {
	// If it is still open, close the speech recognition tab.
	if(speechRecTabId) {
		chrome.tabs.remove(speechRecTabId);
	}
	
	if(query === "I\'m feeling lucky") {
		// “I'm feeling lucky” => open most visited site
		openTopSite("<b>I'm feeling lucky</b>");
	} else if(query === "make me a sandwich") {
		icon.src = "images/pan.png";
		text.innerHTML = query.replace("make", "<b>make</b>");
		subtext.innerHTML = "What?  Make it yourself.";
		
		// If enabled, play an error sound.
		chrome.storage.sync.get({
			sounds: defaultSettings.sounds
		}, function(settings) {
			if(settings.sounds) {
				document.getElementById("errorSound").play();
			}
		});
	} else if(query === "sudo make me a sandwich" || query === "pseudo make me a sandwich") {
		// XKCD sudo easter egg
		query = query.replace("pseudo", "sudo"); // "sudo" gets recognized as "pseudo"; fix that
		icon.src = "images/pan.png";
		text.innerHTML = query.replace("make", "<b>make</b>");
		
		// If enabled, play a sound.
		chrome.storage.sync.get({
			sounds: defaultSettings.sounds
		}, function(settings) {
			if(settings.sounds) {
				document.getElementById("endSound").play();
			}
		});
		
		document.body.className = "loading";
		delayAction(function() {
			openURL("http://xkcd.com/149");
		});
	} else if((/^close( this|( the)? current)? tab$/).test(query)) {
		// Close current tab
		icon.src = "images/tabs.png";
		text.innerHTML = "<b>" + query + "</b>";
		
		// If enabled, play a sound.
		chrome.storage.sync.get({
			sounds: defaultSettings.sounds
		}, function(settings) {
			if(settings.sounds) {
				document.getElementById("endSound").play();
			}
		});
		
		document.body.className = "loading";
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
	} else if(query.indexOf("images of ") === 0 || query.indexOf("pictures of ") === 0 ||
			query.indexOf("photos of ") === 0 || query.indexOf("pics of ") === 0 ||
			query.indexOf("show me ") === 0) {
		// Pictures
		var action = "images of";
		if(query.indexOf("pictures of") === 0) {
			action = "pictures of";
		} else if(query.indexOf("photos of") === 0) {
			action = "photos of";
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
			icon.src = "images/web.png";
			text.innerHTML = query.replace(/^go ?to/, "<b>go to</b>").replace(/^open/, "<b>open</b>");
			document.body.className = "loading";
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
		
		chrome.storage.sync.get({
			launch: defaultSettings.launch
		}, function(settings) {
			var disp = query.replace(action, "<b>" + action + "</b>");
			query = query.replace(action + " ", "");
			if(settings.launch === "chrome") {
				launchApp(disp, query, function() {
					displayError(disp, "No app with that title could be found.");
				});
			} else if(settings.launch === "google") {
				imFeelingLucky(disp, query);
			} else {
				launchApp(disp, query, function() {
					imFeelingLucky(disp, query);
				});
			}
		});
	} else {
		// Default to simple search
		openResult("search", query, query);
	}
}

/**
 * Prepares a result to be opened and updates the pop-up UI accordingly
 * @param {String} type - The type of query (the same identifier used in the defaults and baseURLs objects)
 * @param {String} disp - The text to display in the pop-up
 * @param {String} query - The query to insert into the URL
 */
function openResult(type, disp, query) {
	icon.src = "images/" + type + ".png";
	text.innerHTML = disp;
	
	// If enabled, play a sound.
	playSound("endSound");
	
	document.body.className = "loading";
	delayAction(function() {
		var defaultSetting = {};
		defaultSetting[type] = defaultSettings[type];
		chrome.storage.sync.get(defaultSetting, function(settings) {
			openURL(baseURLs[type][settings[type]].replace("%s", encodeURIComponent(query)));
		});
	});
}

/**
 * Plays a sound if the user has sounds enabled.
 * @param {String} audioElemId - The name of the audio element to play
 */
function playSound(audioElemId) {
	chrome.storage.sync.get({
		sounds: defaultSettings.sounds
	}, function(settings) {
		if(settings.sounds) {
			document.getElementById(audioElemId).play();
		}
	});
}

/**
 * Displays error text in the pop-up
 * @param {String} errtext - The primary error text
 * @param {String} errsubtext - The secondary error text (this may not be necessary and should only contain supplementary information)
 */
function displayError(errtext, errsubtext) {
	icon.src = "images/error.png";
	if(!errtext) {
		text.innerHTML = "An error occurred";
	} else {
		text.innerHTML = errtext;
	}
	if(!errsubtext) {
		subtext.innerHTML = "";
	} else {
		subtext.innerText = errsubtext;
	}
	
	// If enabled, play a sound.
	playSound("errorSound");
}

/**
 * Cancels speech recognition and closes the pop-up.
 */
function cancel() {
	// If enabled, play a sound.
	playSound("cancelSound");
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