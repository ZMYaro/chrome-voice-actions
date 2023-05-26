window.addEventListener('load', async function () {
	// Make chrome:// links work when clicked.
	var permissionPageLink = document.querySelector("a[href^=\"chrome://settings/content/siteDetails\"]");
	permissionPageLink.href = permissionPageLink.href.replace("{{id}}", chrome.runtime.id);
	permissionPageLink.onclick = function (e) {
		e.preventDefault();
		chrome.tabs.create({ url: e.target.href });
	};
	
	var micActive = await checkMicActive();
	if (micActive === false) {
		// If no microphone was found, display a warning.
		document.getElementById("hardwareCheckMessage").style.display = "block";
	}
	
	var permissionGranted = await checkMicPermission();
	if (permissionGranted === false) {
		// If the permission was not granted, display a permission request message.
		if (document.getElementById("permissionRequestMessage")) {
			document.getElementById("permissionRequestMessage").style.display = "block";
		}
	}
});
