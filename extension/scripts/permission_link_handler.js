window.addEventListener('load', function () {
	// Make chrome:// links work when clicked.
	var permissionPageLink = document.querySelector("a[href^=\"chrome://settings/content/siteDetails\"]");
	permissionPageLink.href = permissionPageLink.href.replace("{{id}}", chrome.runtime.id);
	permissionPageLink.addEventListener("click", function (e) {
		e.preventDefault();
		chrome.tabs.create({ url: e.target.href });
	});
});
