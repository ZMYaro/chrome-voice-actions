/**
 * Show the indicator and then perform an action after the user's preferred delay
 * @param {Function} callback - The function to call after the delay
 * @returns {Promise} Resolves when the action and loading indicator have been set up
 */
async function delayAction(callback) {
	var actionDelayTimeSetting = await getSetting('actionDelayTime');
	
	// Prepare the load indicator.
	loadIndicator.style.transitionDuration = Math.floor(actionDelayTimeSetting / 1000) + "s";
	document.body.className = "loading";
	
	// Set the action to fire after the delay.
	setTimeout(callback, actionDelayTimeSetting);
}

/**
 * Open a result using the appropriate service's URL
 * @param {String} type - The type of query (the same identifier used in BASE_URLS and ICON_URLS)
 * @param {String} query - The query to insert into the URL
 */
function handleSearchAction(type, query) {
	delayAction(async function () {
		var typeServiceSetting = await getSetting(type);
		openURL(BASE_URLS[type][typeServiceSetting].replace("%s", encodeURIComponent(query)));
	});
}

/**
 * Open a URL
 * @param {String} url - The URL to open
 * @returns {Promise}
 */
async function openURL(url) {
	var openLocationSetting = await getSetting('openLocation');
	switch (openLocationSetting) {
		case "current":
			var activeTab = await getActiveTab();
			chrome.tabs.update(activeTab.id, { url: url });
			closePopup();
			break;
		case "new":
			chrome.tabs.create({ url: url });
			closePopup();
			break;
		default:
			// Open in the current tab if it is open to the new tab page;
			// otherwise open in a new tab.
			var activeTab = await getActiveTab();
			if (activeTab && activeTab.url.substring(0, 15) === "chrome://newtab") {
				chrome.tabs.update(activeTab.id, { url: url });
			} else {
				chrome.tabs.create({ url: url });
			}
			closePopup();
	}
}

/**
 * Open the most visited site according to Chrome
 * @returns {Promise<MostVisitedURL>} Resolves with the result from the chrome.topSites API, or rejects if there are none
 */
function openTopSite() {
	return new Promise(function (resolve, reject) {
		chrome.topSites.get(function (sites) {
			if (sites.length === 0) {
				reject("You have no top sites.");
				return;
			}
			
			// Open the site.
			delayAction(function () {
				openURL(sites[0].url);
			});
			resolve(sites[0]);
		});
	});
}

/**
 * Launche an installed Chrome app with a given name if there is one
 * @param {String} query - The query
 * @returns {Promise} - Resolves when an app is found and the action set up, or rejects if none is
 */
function launchApp(query) {
	return new Promise(function (resolve, reject) {
		chrome.management.getAll(function (extensions) {
			// Create a variable to hold the id of the best app.
			var topMatchApp;
			// Create a variable to hold the top number of matches.
			var topMatches = 0;
			// Create a variable to hold the earliest index of a match.
			var topEarliestMatch = 9999;
			// Create a regEx that checks for each word in the query.
			var regEx = new RegExp("(" + query.split(/\s+/g).join(")|(") + ")", "ig");
			
			// For each installed extension,
			for (var i = 0; i < extensions.length; i++) {
				// If the extension is enabled and is an app,
				if (extensions[i].enabled && extensions[i].type.indexOf("app") !== -1) {
					// Create a variable to count the number of matches for this app's name.
					var matches = 0;
					// Create a variable to hold the earliest index of a match for this extension.
					var earliestMatch = 9999;
					// Reset the regEx.
					regEx.lastIndex = 0;
					
					while (regEx.exec(extensions[i].name)) {
						// Increase the match count.
						if (matches++ === 0) {
							// If this is the first match, store its index.
							earliestMatch = regEx.lastIndex;
						}
					}
					if (matches > 0 && (matches > topMatches ||
							(matches === topMatches && earliestMatch < topEarliestMatch))) {
						topMatches = matches;
						topEarliestMatch = earliestMatch;
						topMatchApp = extensions[i];
					}
				}
			}
			
			if (!topMatchApp) {
				// If no app was found, error.
				reject("No app with that title could be found.");
				return;
			}
			
			// Open the app.
			delayAction(function () {
				chrome.management.launchApp(topMatchApp.id);
				closePopup();
			});
			resolve();
		});
	});
}

/**
 * Switch to a tab with a given title if there is one
 * @param {String} query - The query to insert into the URL
 * @returns {Promise} Resolves when a matching tab is found and the action set up, or rejects if none is
 */
function switchToTab(query) {
	return new Promise(function (resolve, reject) {
		chrome.windows.getAll({ populate: true }, function (windows) {
			// Combine all the windows' tab arrays into one array.
			var tabs = windows.reduce(function (tabsArr, currentWin) {
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
			for (var i = 0; i < tabs.length; i++) {
				// Create a variable to count the number of matches for this tab.
				var matches = 0;
				// Create a variable to hold the earliest index of a match for this tab.
				var earliestMatch = 9999;
				// Reset the regEx.
				regEx.lastIndex = 0;
				while(regEx.exec(tabs[i].title)) {
					// Increase the match count.
					if (matches++ === 0) {
						// If this is the first match, store its index.
						earliestMatch = regEx.lastIndex;
					}
				}
				if (matches > 0 && (matches > topMatches ||
						(matches === topMatches && earliestMatch < topEarliestMatch))) {
					topMatches = matches;
					topEarliestMatch = earliestMatch;
					topMatchTab = tabs[i];
				}
			}
			
			// If no match was found, return an error.
			if (!topMatchTab) {
				reject("No tab with that title could be found.");
				return;
			}
			
			// Open the tab.
			delayAction(function () {
				chrome.tabs.update(topMatchTab.id, { active: true });
				chrome.windows.update(topMatchTab.windowId, { focused: true });
				closePopup();
			});
			resolve();
		});
	});
}

/**
 * Get the active tab of the current/last focused window.
 * @returns {Promise<Tab>}
 */
function getActiveTab() {
	return new Promise(function (resolve, reject) {
		chrome.tabs.query({ windowId: lastFocusedWindowID, active: true }, function (tabs) {
			resolve(tabs[0]);
		});
	});
}
