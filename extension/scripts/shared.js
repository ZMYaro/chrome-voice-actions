/** @constant {Object<String,String>} Setting IDs and their default values */
var DEFAULT_SETTINGS = {
	"search": "google",
	"images": "google",
	"videos": "youtube",
	"map": "google",
	"directions": "google",
	"launch": "google",
	"music": "spotify",
	"calc": "wolframalpha",
	"imFeelingLucky": "google",
	
	"actionDelayTime": 2050,
	"openLocation": "smart",
	"toolbarIcon": "dark",
	"sounds": true
}

/** @constant {Object<String,String>} URLs for the different action icons */
var ICON_URLS = {
	"browser": "images/actions/chrome.svg",
	"calc": "images/actions/calc.svg",
	"directions": "images/actions/directions.svg",
	"error": "images/actions/error.svg",
	"food": "images/actions/food.svg",
	"images": "images/actions/images.svg",
	"map": "images/actions/map.svg",
	"mic": "images/actions/mic.svg",
	"music": "images/actions/music.svg",
	"search": "images/actions/search.svg",
	"share": "images/actions/share.svg",
	"tabs": "images/actions/tabs.svg",
	"videos": "images/actions/videos.svg",
	"web": "images/actions/web.svg"
};

/** @constant {Object<String,Object<String,String>>} Base URLs for the different web services */
var BASE_URLS = {
	"search": {
		"ask": "https://www.ask.com/web?q=%s",
		"bing": "https://www.bing.com/search?q=%s",
		"duckduckgo": "https://duckduckgo.com/?q=%s",
		"google": "https://www.google.com/search?q=%s",
		"yahoo": "https://search.yahoo.com/search?p=%s"
	},
	"images": {
		"ask": "https://www.ask.com/web?q=images%20of%20%s",
		"bing": "https://www.bing.com/images/search?q=%s",
		"duckduckgo": "https://duckduckgo.com/?ia=images&iax=images&q=%s",
		"flickr": "https://www.flickr.com/search/?q=%s",
		"google": "https://www.google.com/search?tbm=isch&q=%s",
		"imgur": "https://imgur.com/gallery?q=%s",
		"yahoo": "https://images.search.yahoo.com/search/images?p=%s"
	},
	"videos": {
		"ask": "https://www.ask.com/youtube?q=%s",
		"bing": "https://www.bing.com/videos/search?q=%s",
		"dailymotion": "https://www.dailymotion.com/search/%s",
		"duckduckgo": "https://duckduckgo.com/?iax=videos&ia=videos&q=%s",
		"google": "https://www.google.com/search?tbm=vid&q=%s",
		"hulu": "https://www.hulu.com/search?q=%s",
		"metacafe": "https://www.metacafe.com/videos_about/%s",
		"nebula": "https://nebula.tv/search?q=%s",
		"netflix": "https://www.netflix.com/search?q=%s",
		"twitch": "https://www.twitch.tv/search?term=%s",
		"vimeo": "https://vimeo.com/search?q=%s",
		"youtube": "https://www.youtube.com/results?search_query=%s"
	},
	"map": {
		"bing": "https://www.bing.com/maps/?q=%s",
		"duckduckgo": "https://duckduckgo.com/?iaxm=maps&q=%s",
		"google": "https://www.google.com/maps?q=%s",
		"mapquest": "https://www.mapquest.com/search/%s",
		"openstreetmap": "https://www.openstreetmap.org/search?query=%s",
		"yahoo": "https://search.yahoo.com/local/s;?p=%s"
	},
	"directions": {
		"bing": "https://www.bing.com/maps?rtp=~adr.%s",
		"google": "https://maps.google.com/maps?daddr=%s"
	},
	"music": {
		"amazon": "https://music.amazon.com/search/%s",
		"google": "https://play.google.com/music/listen?u=0#/sr/%s",
		"grooveshark": "https://groovesharks.org/?s=%s",
		"lastfm": "https://www.last.fm/search?q=%s",
		"pandora": "https://www.pandora.com/search/%s",
		"soundcloud": "https://soundcloud.com/search?q=%s",
		"spotify": "https://open.spotify.com/search/%s",
		"youtube": "https://music.youtube.com/search?q=%s"
	},
	"calc": {
		"bing": "https://www.bing.com/search?q=%s",
		"duckduckgo": "https://duckduckgo.com/?q=%s",
		"google": "https://www.google.com/search?q=%s",
		"wolframalpha": "https://www.wolframalpha.com/input/?i=%s",
		"yahoo": "https://search.yahoo.com/search?p=%s"
	},
	"imFeelingLucky": {
		"google": "https://www.google.com/search?btnI=745&q=%s"
	}
}

/**
 * Copy options from localStorage to synced storage
 */
function copySettings() {
	// Create an object to hold the settings.
	var settingsToCopy = {};
	// For each setting,
	for (setting in DEFAULT_SETTINGS) {
		// If it is set in localStorage,
		if (localStorage[setting + "Setting"]) {
			// Copy it to the temporary object.
			settingsToCopy[setting] = localStorage[setting + "Setting"];
		}
	}
	// If there were settings in localStorage,
	if (Object.keys(settingsToCopy).length) {
		// Attempt to save the settings to sync storage.
		chrome.storage.sync.set(settingsToCopy, function () {
			// If nothing went wrong,
			if (!chrome.runtime.lastError) {
				// Delete each setting from localStorage.
				for (setting in DEFAULT_SETTINGS) {
					delete localStorage[setting + "Setting"];
				}
			}
		});
	}
}

/**
 * Get a setting from synced storage.
 * @param {String} settingName - The name of the setting
 * @returns {Promise<Boolean|Number|String>} The setting's value, once retrieved, if any
 */
function getSetting(settingName) {
	return new Promise(function (resolve, reject) {
		var apiQuery = {};
		apiQuery[settingName] = DEFAULT_SETTINGS[settingName];
		chrome.storage.sync.get(apiQuery, function (settings) {
			resolve(settings[settingName]);
		});
	});
}

/**
 * Set the toolbar icon.
 * @param {String} color - The color setting value ("dark", "light", "minimal-dark", or "minimal-light")
 */
function setToolbarIcon(color) {
	// "dark" => "icon_xx"
	// "light" => "icon_xx_light"
	// "minimal-light" => "icon_xx_minimal_light"
	var colorSuffix = color
		.replace("minimal-", "_minimal")
		.replace("light", "_light")
		.replace("dark", "");
	chrome.browserAction.setIcon({
		path: {
			16: "../images/logo/icon_16" + colorSuffix + ".png",
			19: "../images/logo/icon_19" + colorSuffix + ".png",
			32: "../images/logo/icon_32" + colorSuffix + ".png",
			38: "../images/logo/icon_38" + colorSuffix + ".png"
		}
	});
}
