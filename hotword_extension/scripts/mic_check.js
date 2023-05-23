window.addEventListener('load', function () {
	// Make chrome:// links work when clicked.
	var permissionPageLink = document.querySelector("a[href^=\"chrome://settings/content/siteDetails\"]");
	permissionPageLink.href = permissionPageLink.href.replace("{{id}}", chrome.runtime.id);
	permissionPageLink.onclick = function (e) {
		e.preventDefault();
		chrome.tabs.create({ url: e.target.href });
	};
	
	if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
		navigator.mediaDevices.enumerateDevices().then(function (devices) {
			// Check whether the list of devices includes a microphone.
			var microphoneDevices = devices.filter(function (device) { return device.kind === "audioinput"; }),
				foundMicrophone = (microphoneDevices.length > 0);
			
			if (!foundMicrophone) {
				// If no microphone was found, display a warning.
				document.getElementById("hardwareCheckMessage").style.display = "block";
			}
		});
	}
	if (navigator.permissions && navigator.permissions.query) {
		// Check whether the user has granted microphone access.
		navigator.permissions.query({ name: "microphone" }).then(function (permissionStatus) {
			if (permissionStatus.state !== "granted") {
				// If the permission was not granted, display a permission request message.
				if (document.getElementById("permissionRequestMessage")) {
					document.getElementById("permissionRequestMessage").style.display = "block";
				}
			}
		});
	}
});
