/** {Boolean} Whether a result (success or error) has been processed by a handler */
var recognitionProcessed = false;

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
	speechInput.onstart = handleSpeechRecStart;
	speechInput.onerror = handleSpeechRecError;
	speechInput.onresult = handleSpeechRecResult;
	speechInput.onend = handleSpeechRecEnd;
	
	// Start speech recognition.
	speechInput.start();
}

/**
 * Handle speech recognition having begun
 */
function handleSpeechRecStart() {
	promptSpeech();
}

/**
 * Handle unsuccessful speech recognition
 * @param {SpeechRecognitionError} e - The recognition error
 */
function handleSpeechRecError(e) {
	if (e.error === "not-allowed" || e.error === "service-not-allowed") {
		// If there was a potential permission error, create a speech recognition tab that can inform the user.
		createSpeechRecTab();
		return;
	}
	// Send error information.
	displayError("An error occurred", e.error.replace(/-/g, " "));
	delayAction(closePopup);
	
	recognitionProcessed = true;
}

/**
 * Handle successful speech recognition
 * @param {SpeechRecognitionEvent} e - The speech recognition result event
 */
function handleSpeechRecResult(e) {
	// If no result was returned, send an error and then exit.
	if (e.results.length === 0) {
		displayError("Nothing was heard.");
		return;
	}
	
	// Send the most accurate interpretation of the speech.
	processQuery(e.results[e.resultIndex][0].transcript);
	
	recognitionProcessed = true;
}

/**
 * Handle speech recognition ending, regardless of result.
 */
function handleSpeechRecEnd(e) {
	if (recognitionProcessed) {
		// If a success or failure handler received the result, let it be processed there.
		return;
	}
	// If it wasn't a success or defined error, treat it as a no speech error.
	displayError("An error occurred", "no speech");
	delayAction(closePopup);
}
