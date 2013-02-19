/** {String} The origin of the page being used to access the Web Speech API */
var srMsgOrigin = "https://googledrive.com";

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
		"youtube":"http://www.youtube.com/results?search_query=%s"
	},
	"calc":{
		"google":"https://www.google.com/search?q=%s",
		"wolframalpha":"http://www.wolframalpha.com/input/?i=%s"
	}
}

window.addEventListener("load", function() {
	document.getElementById("cancelBtn").addEventListener("click", function() {window.close();}, false);
	
	// Get references to DOM elements
	icon = document.getElementById("icon");
	text = document.getElementById("text");
	subtext = document.getElementById("subtext");
}, false);

window.addEventListener("message", function(e) {
	if(e.origin !== srMsgOrigin) {
		msgBox.innerHTML = "Error: Wrong origin - " + e.origin;
		return;
	}
	var data = e.data.split("|");
	switch(data[0]) {
		case "ready":
			icon.src = "images/mic.png";
			text.innerHTML = "Speak now";
		break;
		case "error":
			displayError("An error occurred", data[1]);
		break;
		case "result":
			processResult(data[1]);
		break;
		default:
			displayError("Something unexpected happened", e.data);
		break;
	}
}, false);


function processResult(query) {
	//console.log(query); // for debugging
	
	if(query == "make me a sandwich") {
		icon.src = "images/pan.png";
		text.innerHTML = query.replace("make", "<b>make</b>");
		subtext.innerHTML = "What?  Make it yourself.";
	} else if(query == "sudo make me a sandwich" || query == "pseudo make me a sandwich") {
		// XKCD sudo easter egg
		query = query.replace("pseudo", "sudo"); // "sudo" gets recognized as "pseudo"; fix that
		icon.src = "images/pan.png";
		text.innerHTML = query.replace("make", "<b>make</b>");
		document.body.className = "loading";
		setTimeout(function() {
			openURL("http://xkcd.com/149");
		}, 2050);
	} else if(query.indexOf("map of ") == 0) {
		// Map
		openResult("map", query.replace("map of", "<b>map of</b>"), query.replace("map of ", ""));
	} else if(query.indexOf("directions to ") == 0) {
		// Directions
		openResult("directions", query.replace("directions to", "<b>directions to</b>"), query.replace("directions to ", ""));
	} else if(query.indexOf("calculate ") == 0) {
		// Calculator
		
		// If operators get captured as words, replace them (this
		// does not cover phrases like “the sum of ~ and ~”, but
		// it at least avoids the most basic issues).
		query = query.replace(/plus/g, "+").replace(/minus/g, "-").replace(/times/g, "*").replace(/divided by/g, "/").replace(/over/g, "/");
		
		openResult("calc", query.replace("calculate", "<b>calculate</b>"), query.replace("calculate ", ""));
	} else if(query.indexOf("images of ") == 0 || query.indexOf("pictures of ") == 0 || query.indexOf("photos of ") == 0) {
		// Pictures
		var action = "images of";
		if(query.indexOf("pictures of") == 0) {
			action = "pictures of";
		} else if(query.indexOf("photos of") == 0) {
			action = "photos of";
		}
		openResult("images", query.replace(action, "<b>" + action + "</b>"), query.replace(action + " ", ""));
	} else if(query.indexOf("listen to ") == 0 || query.indexOf("play ") == 0) {
		// Music
		var action = "listen to";
		if(query.indexOf("play") == 0) {
			action = "play";
		}
		
		// A music search for "dead mouse" is almost certainly meant to be "Deadmau5"
		query = query.replace(/dead mouse|dead mau 5/g, "deadmau5");
		
		openResult("music", query.replace(action, "<b>" + action + "</b>"), query.replace(action + " ", ""));
	} else if(query.indexOf("go to ") == 0 || query.indexOf("goto ") == 0 || query.indexOf("open ") == 0) {
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
			setTimeout(function() {
				if(results.length > 0) {
					openURL(results[0].url);
				} else {
					openURL("https://www.google.com/search?btnI=745&q=" + query);
				}
			}, 2050);
		});*/
		var action = "go to";
		if(query.indexOf("goto") == 0) {
			action = "goto";
		} else if(query.indexOf("open") == 0) {
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
	setTimeout(function() {
		openURL(baseURLs[type][(localStorage[type + "Setting"] || defaultSettings[type])].replace("%s", encodeURIComponent(query)));
	}, 2050);
}

/**
 * Opens a new URL
 * @param {String} url - The URL to open
 */
function openURL(url) {
	if((localStorage.openLocationSetting || defaultSettings.openLocation) == "current") {
		chrome.tabs.update(null, {"url":url});
		window.close();
	} else if((localStorage.openLocationSetting || defaultSettings.openLocation) == "new") {
		chrome.tabs.create({"url":url});
	} else {
		chrome.tabs.query({"currentWindow":true, "active":true}, function(tabs) {
			if(tabs[0].url.substring(0,15) == "chrome://newtab") {
				chrome.tabs.update(null, {"url":url});
				window.close();
			} else {
				chrome.tabs.create({"url":url});
			}
		});
	}
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
 * Closes the pop-up after a delay (this basically saves a bunch of setTimeouts in the rest of the code)
 * @param {Number} delay - The number of milliseconds to wait before closing the pop-up (defaults to 2000 if null)
 */
function closePopup(delay) {
	if(!delay) {
		delay = 2000;
	}
	setTimeout(function() {
		window.close();
	}, delay);
}

// Information about the Chrom* speech API can be found at:
// http://code.google.com/chrome/extensions/experimental.speechInput.html
