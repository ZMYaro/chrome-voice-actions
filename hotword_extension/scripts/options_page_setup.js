// Load the HTML from the embedded options page into the standalone options page.
var xhr = new XMLHttpRequest();
xhr.open('GET', 'options_embedded.html', false);
xhr.send();

var fetchedHTML = xhr.responseText,
	bodyHTML = fetchedHTML.match(/<body>([\s\S]*?)<\/body>/)[1];
document.write(bodyHTML);
