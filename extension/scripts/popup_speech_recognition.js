/**
 * Checks if speech recognition is supported, creates an instance, and starts listening
 */
function setUpRecognition() {
	// If speech recognition is not supported in the pop-up, try creating a speech recognition tab instead.
	if (!("webkitSpeechRecognition" in window)) {
		createSpeechRecTab();
		return;
	}
	
	// Create speech recognition object.
	var speechInput = new webkitSpeechRecognition();
	speechInput.continuous = false;
	speechInput.interimResults = false;
	
	// Set speech API event listeners.
	speechInput.onstart = recognitionStarted;
	speechInput.onerror = recognitionFailed;
	speechInput.onresult = recognitionSucceeded;
	
	// Start speech recognition.
	speechInput.start();
}

/**
 * Called when speech recognition has begun
 */
function recognitionStarted() {
	promptSpeech();
}

/**
 * Callback for unsuccessful speech recognition
 * @param {SpeechRecognitionError} e - The recognition error
 */
function recognitionFailed(e) {
	if (e.error === "not-allowed" || e.error === "service-not-allowed") {
		// If there was a potential permission error, create a speech recognition tab that can inform the user.
		createSpeechRecTab();
		return;
	}
	// Send error information.
	displayError("An error occurred", e.error.replace(/-/g, " "));
	delayAction(closePopup);
}

/**
 * Callback for successful speech recognition
 * @param {SpeechRecognitionEvent} e - The speech recognition result event
 */
function recognitionSucceeded(e) {
	// If no result was returned, send an error and then exit.
	if (e.results.length === 0) {
		displayError("Nothing was heard.");
		return;
	}
	
	// Send the most accurate interpretation of the speech.
	processQuery(e.results[e.resultIndex][0].transcript);
}
