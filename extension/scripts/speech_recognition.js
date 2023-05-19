/** {Boolean} Whether a result (success or error) has been processed by a handler */
var recognitionProcessed = false;

window.addEventListener("load", setUpRecognition, false);

/**
 * Checks if speech recognition is supported, creates an instance, and starts listening
 */
function setUpRecognition() {
	// Check if speech recognition is supported, and send an error if it is not.
	if (!("webkitSpeechRecognition" in window)) {
		chrome.extension.sendMessage({
			type: "error",
			text: "Speech input not available",
			subtext: "You must be using Chrome 25 or later."
		});
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
	speechInput.onend = recognitionEnded;
	
	//speechInput.lang = ;
	
	// Start speech recognition.
	speechInput.start();
}

/**
 * Called when speech recognition has begun
 */
function recognitionStarted() {
	chrome.extension.sendMessage({
		type: "ready"
	});
}

/**
 * Callback for unsuccessful speech recognition
 * @param {SpeechRecognitionError} e - The recognition error
 */
function recognitionFailed(e) {
	// Send error information.
	chrome.extension.sendMessage({
		type: "error",
		text: "An error occurred",
		subtext: e.error.replace(/-/g, " ")
	});
	
	recognitionProcessed = true;
}

/**
 * Callback for successful speech recognition
 * @param {SpeechRecognitionEvent} e - The speech recognition result event
 */
function recognitionSucceeded(e) {
	// If no result was returned, send an error and then exit.
	if (e.results.length === 0) {
		chrome.extension.sendMessage({
			type: "error",
			text: "Nothing was heard."
		});
		return;
	}
	
	// Send the most accurate interpretation of the speech.
	chrome.extension.sendMessage({
		type: "result",
		text: e.results[e.resultIndex][0].transcript
	});
	
	recognitionProcessed = true;
}

/**
 * Callback for speech recognition ending, regardless of result.
 */
function recognitionEnded(e) {
	if (recognitionProcessed) {
		// If a success or failure handler received the result, let it be processed there.
		return;
	}
	// If it wasn't a success or defined error, treat it as a no speech error.
	chrome.extension.sendMessage({
		type: "error",
		text: "An error occurred",
		subtext: "no speech"
	});
}
