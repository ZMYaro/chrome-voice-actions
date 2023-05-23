/** @constant {Object} The definitions for the default query types */
var ACTIONS = {
	/*
	{RegExp} regex - to match all valid queries for this action, with the keyword in the first capture group (/(keyword) .+/i)
	{String} icon - URL (or defaults to query name)
	{String} sound - "error" or "cancel" (or defaults to "end")
	{Function(query, disp)} handler - (or defaults to handleSearchAction)
	*/
	"sandwich": {
		"regex": /^(make) me a sandwich$/i,
		"icon": ICON_URLS.food,
		"sound": "error",
		"handler": function (query, disp) {
			disp.subText = "What?  Make it yourself.";
		}
	},
	"sudoSandwich": {
		"regex": /^(p?se?udo make) me a sandwich$/i, // Recognize “sudo” or “pseudo”
		"icon": ICON_URLS.food,
		"handler": function (query, disp) {
			disp.text = disp.text.replace('pseudo', 'sudo');
			delayAction(() => openURL("http://xkcd.com/149"));
		}
	},
	"imFeelingLucky": {
		// “I'm feeling lucky” => open most visited site
		"regex": /^(I'm feeling lucky)$/i,
		"icon": ICON_URLS.web,
		"handler": async function (query, disp) {
			var topSite = await openTopSite();
			disp.subText = "Opening " + topSite.title;
		}
	},
	"closeTab": {
		"regex": /^(close( this|( the)? current)? tab)$/i,
		"icon": ICON_URLS.tabs,
		"handler": function (query, disp) {
			delayAction(async function () {
				var activeTab = await getActiveTab();
				chrome.tabs.remove(activeTab.id);
				closePopup();
			});
		}
	},
	"closeWindow": {
		"regex": /^(close( this|( the)? current)? window)$/i,
		"icon": ICON_URLS.tabs,
		"handler": function (query, disp) {
			delayAction(function () {
				chrome.windows.remove(lastFocusedWindowID);
				closePopup();
			});
		}
	},
	"switchToTab": {
		"regex": /^(switch to) .+$/i,
		"icon": ICON_URLS.tabs,
		"handler": switchToTab
	},
	"calc": {
		"regex": /^(calculate) .+$/i
	},
	"directions": {
		"regex": /^(directions to) .+$/i
	},
	"map": {
		"regex": /^(map of) .+$/i
	},
	"images": {
		"regex": /^(((image|picture|pic|photo)s? of)|show me) .+$/i
	},
	"videos": {
		"regex": /^(((video|movie|flick)s? of)|watch) .+$/i
	},
	"music": {
		"regex": /^(listen to|play) .+$/i,
		"handler": function (query, disp) {
			// A music search for "dead mouse" is almost certainly meant to be "Deadmau5"
			query = query.replace(/dead mouse|dead mau 5/g, "deadmau5");
			disp.text = disp.text.replace(/dead mouse|dead mau 5/g, "deadmau5");
			handleSearchAction("music", query);
		}
	},
	"browserSettings": {
		"regex": /^((open |chrome |browser )?settings)$/i,
		"icon": ICON_URLS.browser,
		"handler": function (query, disp) {
			delayAction(() => openURL("chrome://settings"));
		}
	},
	"browserHelp": {
		"regex": /^((open |chrome |browser )?help)$/i,
		"icon": ICON_URLS.browser,
		"handler": function (query, disp) {
			delayAction(() => openURL("https://support.google.com/chrome"));
		}
	},
	"browserHistory": {
		"regex": /^((open |chrome |browser )?history)$/i,
		"icon": ICON_URLS.browser,
		"handler": function (query, disp) {
			delayAction(() => openURL("chrome://history"));
		}
	},
	"extensionOptions": {
		"regex": /^((what can i say)|(open )?(extension |voice actions? )?(options|settings|help))$/i,
		"icon": ICON_URLS.mic,
		"handler": function (query, disp) {
			if (chrome.runtime.openOptionsPage) {
				delayAction(chrome.runtime.openOptionsPage);
			} else {
				delayAction(() => openURL(chrome.runtime.getURL("options_page.html")));
			}
		}
	},
	"launch": {
		// Launch from user's Chrome apps OR Google I'm Feeling Lucky
		"regex": /^(go ?to|open|launch) .+$/i,
		"icon": ICON_URLS.web,
		"handler": async function (query, disp) {
			var launchSetting = await getSetting('launch');
			switch (launchSetting) {
				case "chrome":
					await launchApp(query);
					break;
				case "google":
					handleSearchAction("imFeelingLucky", query);
					break;
				default:
					try {
						await launchApp(query);
					} catch (err) {
						handleSearchAction("imFeelingLucky", query);
					}
			}
		}
	},
	"search": {
		// Catch-all for anything else.
		"regex": /.+/
	}
};
