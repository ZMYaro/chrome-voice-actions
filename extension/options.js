window.addEventListener("load", function() {
	for(setting in defaultSettings) {
		// Set all the drop-downs
		document.getElementById(setting + "Setting").value = (localStorage[setting + "Setting"] || defaultSettings[setting]);
		
		// Add event listeners to all the drop-downs
		document.getElementById(setting + "Setting").addEventListener("change", function(e) {
			setSetting(e.target.id.replace("Setting", ""), e.target.value);
		}, false);
	}
}, false);
function setSetting(setting, value) {
	localStorage[setting + "Setting"] = value;
}
