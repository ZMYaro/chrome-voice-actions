window.addEventListener("load", function() {
	// Load OS styles and set up chrome:// links when the page loads.
	loadOSStyles();
	setUpChromeLinks();
	
	for(setting in defaultSettings) {
		// Set all the drop-downs.
		document.getElementById(setting + "Setting").value = (localStorage[setting + "Setting"] || defaultSettings[setting]);
		
		// Add event listeners to all the drop-downs.
		document.getElementById(setting + "Setting").addEventListener("change", function(e) {
			setSetting(e.target.id.replace("Setting", ""), e.target.value);
		}, false);
	}
	
	// Create a speech recognition instance.
	var speechInput = new webkitSpeechRecognition();
	speechInput.continuous = false;
	speechInput.interimResults = false;
	// Add an event listener for when speech recognition starts successfully.
	speechInput.onstart = function(e) {
		// At this point, the omnibox media icon should be displayed.  There is
		// no need for speech recognition to continue, so abort it.
		e.target.abort();
	};
	
	// Attempt to start speech recognition (and, as a result, display the omnibox media icon).
	speechInput.start();
}, false);

function setSetting(setting, value) {
	localStorage[setting + "Setting"] = value;
}

/**
 * Load the stylesheet that will pick the correct font for the user's OS
 */
function loadOSStyles() {
	var osStyle = document.createElement('link');
	osStyle.rel = 'stylesheet';
	osStyle.type = 'text/css';
	if(navigator.userAgent.indexOf('Windows') !== -1) {
		osStyle.href = 'styles/options-win.css';
	} else if(navigator.userAgent.indexOf('Macintosh') !== -1) {
		osStyle.href = 'styles/options-mac.css';
	} else if(navigator.userAgent.indexOf('CrOS') !== -1) {
		osStyle.href = 'styles/options-cros.css';
		// Change the “Chrome” label to “Chrome OS” on CrOS.
		document.querySelector('.sideBar h1').innerText = 'Chrome OS';
	} else {
		osStyle.href = 'styles/options-linux.css';
	}
	document.head.appendChild(osStyle);
}
/**
 * Change any chrome:// link to use the goToPage function
 */
function setUpChromeLinks() {
	// Get the list of <a>s.
	var links = document.getElementsByTagName('a');
	// For each link,
	for(var i = 0; i < links.length; i++) {
		// if the URL begins with �chrome://�,
		if(links[i].href.indexOf('chrome://') === 0) {
			// tell it to goToPage onclick.
			links[i].onclick = goToPage;
		}
	}
}
/**
 * Use chrome.tabs.update to open a link Chrome will not open normally
 */
function goToPage(e) {
	// Prevent the browser from following the link.
	e.preventDefault();
	chrome.tabs.update({ url: e.target.href });
}