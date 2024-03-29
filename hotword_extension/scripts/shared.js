/** @constant {String} The ID of the main Voice Actions for Chrome extension in the Chrome Web Store */
var VOICE_ACTIONS_EXT_ID = "hhpjefokaphndbbidpehikcjhldaklje";

/** @constant {String} The ID of the main Voice Actions extension with ExtensionPay */
var EXTPAY_ID = "voice-actions";

/** @constant {Object<String,*>} Setting IDs and their default values */
var DEFAULT_SETTINGS = {
	setUp: false
};

/**
 * Check whether the device has an active microphone.
 * @returns {Promise<Boolean>} - `true` if a microphone was found, `false` if not, and `undefined` if unable to tell
 */
async function checkMicActive() {
	if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
		return undefined;
	}
	// Check whether the list of devices includes a microphone.
	var devices = await navigator.mediaDevices.enumerateDevices(),
		microphoneDevices = devices.filter(function (device) { return device.kind === "audioinput"; });
	return (microphoneDevices.length > 0);
}

/**
 * Check whether the extension has microphone permission.
 * @returns {Promise<Boolean>} - `true` if granted, `false` if not, and `undefined` if unable to tell
 */
async function checkMicPermission() {
	if (!navigator.permissions || !navigator.permissions.query) {
		return undefined;
	}
	// Check whether the user has granted microphone access.
	var permissionStatus = await navigator.permissions.query({ name: "microphone" });
	return (permissionStatus.state === "granted");
}

/**
 * Get a setting from the Chrome storage API.
 * @param {String} settingName - The name of the setting
 * @param {String} [storageArea] - "local" or "sync" (defaults to "sync")
 * @returns {Promise<Boolean|Number|String>} The setting's value, once retrieved, if any
 */
function getSetting(settingName, defaultValue, storageArea) {
	return new Promise(function (resolve, reject) {
		var apiQuery = {};
		apiQuery[settingName] = defaultValue || DEFAULT_SETTINGS[settingName];
		chrome.storage[storageArea || "sync"].get(apiQuery, function (settings) {
			resolve(settings[settingName]);
		});
	});
}
