var iframe = document.createElement("iframe");
iframe.src = chrome.extension.getURL("speech_recognition.html");
document.body.appendChild(iframe);