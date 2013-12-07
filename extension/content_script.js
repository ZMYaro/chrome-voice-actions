chrome.runtime.onMessage.addListener(function(message, sender) {
	if(!sender.tab && message.type === "start") {
		setUpRecognition();
	}
});

/**
 * Checks if speech recognition is supported, creates an instance, and starts listening
 */
function setUpRecognition() {
	// Check if speech recognition is supported, and send an error if it is not.
	if(!("webkitSpeechRecognition" in window)) {
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
	// Send error information
	chrome.extension.sendMessage({
		type: "error",
		text: "An error occurred",
		subtext: e.error.replace(/-/g, " ")
	});
}

/**
 * Callback for successful speech recognition
 * @param {SpeechRecognitionEvent} e - The speech recognition result event
 */
function recognitionSucceeded(e) {
	// If no result was returned, send an error and then exit.
	if(e.results.length === 0) {
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
}

console.log("----==== CONTENT SCRIPT LOADED ====----");