var iframe = document.createElement("iframe");
iframe.src = chrome.extension.getURL("speech_recognition.html");
iframe.style.width = "0";
iframe.style.height = "0";
iframe.style.border = "0 none";
iframe.style.display = "none";
document.body.appendChild(iframe);