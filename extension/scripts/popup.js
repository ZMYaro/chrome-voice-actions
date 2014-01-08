/** {HTMLImageElement} The icon in the pop-up */
var icon;

/** {HTMLParagraphElement} The primary text in the pop-up */
var text;

/** {HTMLParagraphElement} The secondary text in the pop-up */
var subtext;

/** {Object} Base URLs for the different web services */
var baseURLs = {
	"search":{
		"ask":"http://www.ask.com/web?q=%s",
		"bing":"http://www.bing.com/search?q=%s",
		"google":"https://www.google.com/search?q=%s",
		"yahoo":"http://search.yahoo.com/search?p=%s"
	},
	"images":{
		"ask":"http://www.ask.com/pictures?q=%s",
		"bing":"http://www.bing.com/images/search?q=%s",
		"flickr":"http://www.flickr.com/search/?q=%s",
		"google":"https://www.google.com/search?tbm=isch&q=%s",
		"imgur":"http://imgur.com/gallery?q=%s",
		"yahoo":"http://images.search.yahoo.com/search/images?p=%s"
	},
	"videos": {
		"ask": "http://www.ask.com/youtube?q=%s",
		"bing": "http://www.bing.com/videos/search?q=%s",
		"google": "https://www.google.com/search?tbm=vid&q=%s",
		"youtube":"http://www.youtube.com/results?search_query=%s"
	},
	"map":{
		"google":"https://maps.google.com/maps?q=%s",
		"bing":"http://www.bing.com/maps/?q=%s",
		"yahoo":"http://maps.yahoo.com/#q=%s"
	},
	"directions":{
		"google":"http://maps.google.com/maps?daddr=%s"
	},
	"web":{
		"google":"https://www.google.com/search?btnI=745&q=%s"
	},
	"music":{
		"amazon":"https://www.amazon.com/gp/dmusic/mp3/player#searchSongs/searchTerm=%s",
		"google":"https://play.google.com/music/listen?u=0#%s_sr",
		"grooveshark":"http://grooveshark.com/#!/search?q=%s",
		"lastfm":"http://www.last.fm/search?q=%s",
		"pandora":"http://www.pandora.com/search/%s",
		"soundcloud": "https://soundcloud.com/search?q=%s",
		"spotify": "https://play.spotify.com/search/%s",
		"youtube":"http://www.youtube.com/results?search_query=%s"
	},
	"calc":{
		"google":"https://www.google.com/search?q=%s",
		"wolframalpha":"http://www.wolframalpha.com/input/?i=%s"
	}
}

window.addEventListener("load", function() {
	chrome.storage.sync.get({
		actionDelayTime: defaultSettings.actionDelayTime
	}, function(settings) {
		document.body.style.WebkitTransitionDuration =
			document.body.style.transitionDuration = Math.floor(settings.actionDelayTime / 1000) + "s";
	});
		
	document.getElementById("cancelBtn").addEventListener("click", function() { window.close(); }, false);
	
	// Get references to DOM elements
	icon = document.getElementById("icon");
	text = document.getElementById("text");
	subtext = document.getElementById("subtext");
	
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
	});
}, false);

chrome.extension.onMessage.addListener(function(message) {
	switch(message.type) {
		case "ready":
			// Prompt the user to speak.
			icon.src = "images/mic.png";
			text.innerHTML = "Speak now";
			break;
		case "result":
			processResult(message.text);
			break;
		case "error":
			// Display error information, and then exit.
			displayError(message.text, message.subtext);
			delayAction(window.close);
			break;
	}
});

/**
 * Process the speech recognition result
 * @param {String} query - The query string to process
 */
function processResult(query) {
	//console.log(query); // for debugging
	
	if(query === "make me a sandwich") {
		icon.src = "images/pan.png";
		text.innerHTML = query.replace("make", "<b>make</b>");
		subtext.innerHTML = "What?  Make it yourself.";
	} else if(query === "sudo make me a sandwich" || query === "pseudo make me a sandwich") {
		// XKCD sudo easter egg
		query = query.replace("pseudo", "sudo"); // "sudo" gets recognized as "pseudo"; fix that
		icon.src = "images/pan.png";
		text.innerHTML = query.replace("make", "<b>make</b>");
		document.body.className = "loading";
		delayAction(function() {
			openURL("http://xkcd.com/149");
		});
	} else if((/^close( this|( the)? current)? tab$/).test(query)) {
		// Close current tab
		icon.src = "images/tabs.png";
		text.innerHTML = "<b>" + query + "</b>";
		document.body.className = "loading";
		delayAction(function() {
			chrome.tabs.query({
				active: true,
				currentWindow: true
			}, function(tabs) {
				chrome.tabs.remove(tabs[0].id);
				window.close();
			});
		});
	} else if(query.indexOf("switch to ") === 0) {
		// Switch to tab
		switchToTab(query.replace("switch to", "<b>switch to</b>"), query.replace("switch to ", ""));S
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
			query.indexOf("photos of ") === 0 || query.indexOf("pics of ") === 0) {
		// Pictures
		var action = "images of";
		if(query.indexOf("pictures of") === 0) {
			action = "pictures of";
		} else if(query.indexOf("photos of") === 0) {
			action = "photos of";
		} else if(query.indexOf("pics of") === 0) {
			action = "pics of";
		}
		openResult("images", query.replace(action, "<b>" + action + "</b>"), query.replace(action + " ", ""));
	} else if(query.indexOf("video of ") === 0 || query.indexOf("videos of ") === 0 ||
			query.indexOf("movie of ") === 0 || query.indexOf("movies of ") === 0) {
		// Videos
		var action = "video of";
		if(query.indexOf("videos of") === 0) {
			action = "videos of";
		} else if(query.indexOf("movie of") === 0) {
			action = "movie of";
		} else if(query.indexOf("movies of") === 0) {
			action = "movies of";
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
	} else if(query.indexOf("go to ") === 0 || query.indexOf("goto ") === 0 || query.indexOf("open ") === 0) {
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
		}
		openResult("web", query.replace(action, "<b>" + action + "</b>"), query.replace(action + " ", ""));
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
 * Opens a new URL
 * @param {String} url - The URL to open
 */
function openURL(url) {
	chrome.storage.sync.get({
		openLocation: defaultSettings.openLocation
	}, function(settings) {
		if(settings.openLocation === "current") {
			chrome.tabs.update(null, {"url":url});
			window.close();
		} else if(settings.openLocation === "new") {
			chrome.tabs.create({"url":url});
		} else {
			chrome.tabs.query({"currentWindow":true, "active":true}, function(tabs) {
				if(tabs[0].url.substring(0,15) === "chrome://newtab") {
					chrome.tabs.update(null, {"url":url});
					window.close();
				} else {
					chrome.tabs.create({"url":url});
				}
			});
		}
	});
}

/**
 * Switches to a given tab
 * @param {String} disp - The text to display in the pop-up
 * @param {String} query - The query to insert into the URL
 */
function switchToTab(disp, query) {
	icon.src = "images/tabs.png";
	text.innerHTML = disp;
	
	chrome.windows.getAll({populate: true}, function(windows) {
		// Combine all the windows' tab arrays into one array.
		var tabs = windows.reduce(function(tabsArr, currentWin) {
			return tabsArr.concat(currentWin.tabs);
		}, []);
		// Create a variable to hold the id of the best tab.
		var topMatchTab;
		// Create a variable to hold the top number of matches.
		var topMatches = -1;
		// Create a variable to hold the earliest index of a match.
		var topEarliestMatch = 9999;
		// Create a regEx that checks for each word in the query.
		var regEx = new RegExp("(" + query.split(/s+/g).join(")|(") + ")", "ig");
		for(var i = 0; i < tabs.length; i++) {
			// Create a variable to count the number of matches for this tab.
			var matches = 0;
			// Create a variable to hold the earliest index of a match for this tab.
			var earliestMatch = 9999;
			// Reset the regEx.
			regEx.lastIndex = 0;
			while(regEx.exec(tabs[i].title)) {
				// Increase the match count.
				if(matches++ === 0) {
					// If this is the first match, store its index.
					earliestMatch = regEx.lastIndex;
				}
			}
			if(matches > topMatches ||
					(matches === topMatches && earliestMatch < topEarliestMatch)) {
				topMatches = matches;
				topEarliestMatch = earliestMatch;
				topMatchTab = tabs[i];
			}
		}
		
		// If a match was found,
		if(topMatchTab) {
			// Display a loading message, and open the tab after a delay.
			document.body.className = "loading";
			delayAction(function() {
				chrome.tabs.update(topMatchTab.id, {active: true});
				chrome.windows.update(topMatchTab.windowId, {focused: true});
			});
		} else { // Otherwise, display an error.
			displayError(disp, "No tab with that title could be found.");
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
}

/**
 * Performs an action after a delay (this basically saves a bunch of setting fetches and setTimeouts in the rest of the code)
 * @param {Function} callback - The function to call after the delay
 * @param {Number} delay - A custom delay (if undefined, uses the user's set delay or the default setting)
 */
function delayAction(callback, delay) {
	var defaultSetting = {actionDelayTime: defaultSettings.actionDelayTime};
	if(delay && typeof delay === "number") {
		defaultSetting.actionDelayTime = delay;
	}
	chrome.storage.sync.get(defaultSetting, function(settings) {
		setTimeout(callback, settings.actionDelayTime);
	});
}