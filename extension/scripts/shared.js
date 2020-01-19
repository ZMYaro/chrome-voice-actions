var defaultSettings = {
	"search":"google",
	"images":"google",
	"videos": "youtube",
	"map":"google",
	"directions":"google",
	"launch": "google",
	"music":"google",
	"calc":"wolframalpha",
	
	"actionDelayTime": 2050,
	"openLocation":"smart",
	"sounds": true
}

/** {Object} URLs for the different action icons */
var iconURLs = {
	"calc": "images/calc.png",
	"directions": "images/directions.png",
	"error": "images/error.png",
	"food": "images/pan.png",
	"images": "images/images.png",
	"map": "images/map.png",
	"mic": "images/mic.png",
	"music": "images/music.png",
	"search": "images/search.png",
	"tabs": "images/tabs.png",
	"videos": "images/videos.png",
	"web": "images/web.png"
};

/** {Object} Base URLs for the different web services */
var baseURLs = {
	"search": {
		"ask": "http://www.ask.com/web?q=%s",
		"bing": "http://www.bing.com/search?q=%s",
		"google": "https://www.google.com/search?q=%s",
		"yahoo": "http://search.yahoo.com/search?p=%s"
	},
	"images": {
		"ask": "http://www.ask.com/pictures?q=%s",
		"bing": "http://www.bing.com/images/search?q=%s",
		"flickr": "http://www.flickr.com/search/?q=%s",
		"google": "https://www.google.com/search?tbm=isch&q=%s",
		"imgur": "http://imgur.com/gallery?q=%s",
		"yahoo": "http://images.search.yahoo.com/search/images?p=%s"
	},
	"videos": {
		"ask": "http://www.ask.com/youtube?q=%s",
		"bing": "http://www.bing.com/videos/search?q=%s",
		"dailymotion": "http://www.dailymotion.com/relevance/search/%s",
		"google": "https://www.google.com/search?tbm=vid&q=%s",
		"hulu": "http://www.hulu.com/search?q=%s",
		"metacafe": "http://www.metacafe.com/topics/%s",
		"netflix": "http://dvd.netflix.com/Search?v1=%s",
		"twitch": "http://www.twitch.tv/search?query=%s",
		"vimeo": "http://vimeo.com/search?q=%s",
		"youtube": "https://www.youtube.com/results?search_query=%s"
	},
	"map": {
		"google": "https://maps.google.com/maps?q=%s",
		"bing": "http://www.bing.com/maps/?q=%s",
		"yahoo": "http://maps.yahoo.com/#q=%s"
	},
	"directions": {
		"google": "http://maps.google.com/maps?daddr=%s"
	},
	"music": {
		"amazon": "https://www.amazon.com/gp/dmusic/mp3/player#searchSongs/searchTerm=%s",
		"google": "https://play.google.com/music/listen?u=0#%s_sr",
		"grooveshark": "http://grooveshark.com/#!/search?q=%s",
		"lastfm": "http://www.last.fm/search?q=%s",
		"pandora": "http://www.pandora.com/search/%s",
		"soundcloud": "https://soundcloud.com/search?q=%s",
		"spotify": "https://play.spotify.com/search/%s",
		"youtube": "http://www.youtube.com/results?search_query=%s"
	},
	"calc": {
		"google": "https://www.google.com/search?q=%s",
		"wolframalpha": "http://www.wolframalpha.com/input/?i=%s"
	},
	"imFeelingLucky": {
		
	}
}

/**
 * Copy options from localStorage to synced storage
 */
function copySettings() {
	// Create an object to hold the settings.
	var settingsToCopy = {};
	// For each setting,
	for(setting in defaultSettings) {
		// If it is set in localStorage,
		if(localStorage[setting + "Setting"]) {
			// Copy it to the temporary object.
			settingsToCopy[setting] = localStorage[setting + "Setting"];
		}
	}
	// If there were settings in localStorage,
	if(Object.keys(settingsToCopy).length) {
		// Attempt to save the settings to sync storage.
		chrome.storage.sync.set(settingsToCopy, function() {
			// If nothing went wrong,
			if(!chrome.runtime.lastError) {
				// Delete each setting from localStorage.
				for(setting in defaultSettings) {
					delete localStorage[setting + "Setting"];
				}
			}
		});
	}
}