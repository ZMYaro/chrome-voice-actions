/**
 * Performs an action after a delay (this basically saves a bunch of setting fetches and setTimeouts in the rest of the code)
 * @param {Function} callback - The function to call after the delay
 * @param {Number} delay - A custom delay (if undefined, uses the user's set delay or the default setting)
 */
function delayAction(callback, delay) {
	var defaultSetting = {actionDelayTime: DEFAULT_SETTINGS.actionDelayTime};
	if(delay && typeof delay === "number") {
		defaultSetting.actionDelayTime = delay;
	}
	chrome.storage.sync.get(defaultSetting, function(settings) {
		// Prepare the load indicator.
		loadIndicator.style.transitionDuration = Math.floor(settings.actionDelayTime / 1000) + "s";
		document.body.className = "loading";
		
		// Set the action to fire after the delay.
		setTimeout(callback, settings.actionDelayTime);
	});
}

/**
 * Prepares a result to be opened and updates the pop-up UI accordingly
 * @param {String} type - The type of query (the same identifier used in the defaults and BASE_URLS objects)
 * @param {String} disp - The text to display in the pop-up
 * @param {String} query - The query to insert into the URL
 */
function openResult(type, disp, query) {
	icon.src = ICON_URLS[type];
	text.innerHTML = disp;
	
	// If enabled, play a sound.
	playSound("endSound");
	
	delayAction(function() {
		var defaultSetting = {};
		defaultSetting[type] = DEFAULT_SETTINGS[type];
		chrome.storage.sync.get(defaultSetting, function(settings) {
			openURL(BASE_URLS[type][settings[type]].replace("%s", encodeURIComponent(query)));
		});
	});
}

/**
 * Opens a new URL
 * @param {String} url - The URL to open
 */
function openURL(url) {
	chrome.storage.sync.get({
		openLocation: DEFAULT_SETTINGS.openLocation
	}, function(settings) {
		if(settings.openLocation === "current") {
			chrome.tabs.update(null, {"url":url});
			closePopup();
		} else if(settings.openLocation === "new") {
			chrome.tabs.create({"url":url});
			closePopup();
		} else {
			chrome.tabs.query({"currentWindow":true, "active":true}, function(tabs) {
				if(tabs[0].url.substring(0,15) === "chrome://newtab") {
					chrome.tabs.update(null, {"url":url});
					closePopup();
				} else {
					chrome.tabs.create({"url":url});
					closePopup();
				}
			});
		}
	});
}

/**
 * Open top site
 * @param {String} disp - The text to display in the pop-up
 */
function openTopSite(disp) {
	// Display the web icon.
	icon.src = ICON_URLS.web;
	// Display the main text.
	text.innerHTML = disp;
	
	chrome.topSites.get(function(sites) {
		if(sites.length === 0) {
			displayError("You have no top sites.");
			return;
		}
		
		// Display the site title.
		subtext.innerText = subtext.textContent = "Opening " + sites[0].title;
		
		// If enabled, play a sound.
		playSound("endSound");
		
		// Display a loading message and open the site after a delay.
		delayAction(function() {
			openURL(sites[0].url);
		});
	});
}

/**
 * Performs a Google “I'm Feeling Lucky” query
 * @param {String} disp - The text to display in the pop-up
 * @param {String} query - The query
 */
function imFeelingLucky(disp, query) {
	// Display the web icon.
	icon.src = ICON_URLS.web;
	// Display the user's query.
	text.innerHTML = disp;
	
	var IM_FEELING_LUCKY_URL = "https://www.google.com/search?btnI=745&q=%s";
	
	// If enabled, play a sound.
	playSound("endSound");
	
	// Display a loading message and open the site after a delay.
	delayAction(function() {
		openURL(IM_FEELING_LUCKY_URL.replace("%s", query));
	});
}

/**
 * Launches an installed Chrome app with a given name (if there is one)
 * @param {String} disp - The text to display in the pop-up
 * @param {String} query - The query
 * @param {Function} errorCallback - The function to call if there is no match
 */
function launchApp(disp, query, errorCallback) {
	// Display the web icon.
	icon.src = ICON_URLS.web;
	// Display the user's query.
	text.innerHTML = disp;
	
	chrome.management.getAll(function(extensions) {
		// Create a variable to hold the id of the best app.
		var topMatchApp;
		// Create a variable to hold the top number of matches.
		var topMatches = 0;
		// Create a variable to hold the earliest index of a match.
		var topEarliestMatch = 9999;
		// Create a regEx that checks for each word in the query.
		var regEx = new RegExp("(" + query.split(/\s+/g).join(")|(") + ")", "ig");
		
		// For each installed extension,
		for(var i = 0; i < extensions.length; i++) {
			// If the extension is enabled and is an app,
			if(extensions[i].enabled && extensions[i].type.indexOf("app") !== -1) {
				// Create a variable to count the number of matches for this app's name.
				var matches = 0;
				// Create a variable to hold the earliest index of a match for this extension.
				var earliestMatch = 9999;
				// Reset the regEx.
				regEx.lastIndex = 0;
				
				while(regEx.exec(extensions[i].name)) {
					// Increase the match count.
					if(matches++ === 0) {
						// If this is the first match, store its index.
						earliestMatch = regEx.lastIndex;
					}
				}
				if(matches > 0 && (matches > topMatches ||
						(matches === topMatches && earliestMatch < topEarliestMatch))) {
					topMatches = matches;
					topEarliestMatch = earliestMatch;
					topMatchApp = extensions[i];
				}
			}
		}
		
		// If an app was found,
		if(topMatchApp) {
			// If enabled, play a sound.
			playSound("endSound");
			// Display a loading message, and open the app after a delay.
			delayAction(function() {
				chrome.management.launchApp(topMatchApp.id);
				closePopup();
			});
		} else { // Otherwise, display an error.
			errorCallback();
		}
	});
}

/**
 * Switches to a given tab
 * @param {String} disp - The text to display in the pop-up
 * @param {String} query - The query to insert into the URL
 */
function switchToTab(disp, query) {
	// Display the tabs icon.
	icon.src = ICON_URLS.tabs;
	// Display the user's query.
	text.innerHTML = disp;
	
	chrome.windows.getAll({populate: true}, function(windows) {
		// Combine all the windows' tab arrays into one array.
		var tabs = windows.reduce(function(tabsArr, currentWin) {
			return tabsArr.concat(currentWin.tabs);
		}, []);
		// Create a variable to hold the id of the best tab.
		var topMatchTab;
		// Create a variable to hold the top number of matches.
		var topMatches = 0;
		// Create a variable to hold the earliest index of a match.
		var topEarliestMatch = 9999;
		// Create a regEx that checks for each word in the query.
		var regEx = new RegExp("(" + query.split(/\s+/g).join(")|(") + ")", "ig");
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
			if(matches > 0 && (matches > topMatches ||
					(matches === topMatches && earliestMatch < topEarliestMatch))) {
				topMatches = matches;
				topEarliestMatch = earliestMatch;
				topMatchTab = tabs[i];
			}
		}
		
		// If a match was found,
		if(topMatchTab) {
			// If enabled, play a sound.
			playSound("endSound");
			// Display a loading message, and open the tab after a delay.
			delayAction(function() {
				chrome.tabs.update(topMatchTab.id, {active: true});
				chrome.windows.update(topMatchTab.windowId, {focused: true});
				closePopup();
			});
		} else { // Otherwise, display an error.
			displayError(disp, "No tab with that title could be found.");
		}
	});
}
