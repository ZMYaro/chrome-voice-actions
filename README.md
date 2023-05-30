# Voice Actions for Chrome
<img src="https://raw.githubusercontent.com/ZMYaro/chrome-voice-actions/master/promo_graphics/cover_tw.png" width="960" alt="You talk, Chrome understands.  Voice Actions for Chrome.  An ear has a Chrome logo earring." />

This is a Chrome extension that lets you search the web and perform certain actions using speech input.  It is similar to (but unaffiliated with) the Google Voice Actions app on Android 2.x, but was first such extension available for Chrome.

While not officially supported, it should work on other browsers that are compatible with Chrome extensions.

Features include:
* Search the web with spoken queries.
* Open web pages just by saying their names.
* Get maps or directions by saying the name of a location or destination.
* Search for music by saying the name of an artist, album, or song.
* No need to search through piles of tabs—just speak the title, and Voice Actions will find it.
* Activate hands-free—just say “OK Chrome”✴️
* One Easter egg

--------

## Install the extension

**[Voice Actions for Chrome is available on the Chrome Web Store.](https://chrome.google.com/webstore/detail/hhpjefokaphndbbidpehikcjhldaklje)**  
[The “OK Chrome” add-on is available on its own Chrome Web Store page.](https://chrome.google.com/webstore/detail/gclpfolambnbjfeglhbjojolplnlpolg)

Previously, an up-to-date Chrome extension file was hosted with this repository.  If you installed that version of the extension, it should automatically upgrade to the Chrome Web Store version, but you can also go to the Web Store and install the latest version manually.

## Privacy

Voice Actions for Chrome **only** listens when the microphone pop-up is open.

The separate “OK Chrome” hotword add-on listens in the background and discards any detected speech that isn't “Hey Chrome”/“OK Chrome”.  You can disable or uninstall the add-on at any time and still continue using the main Voice Actions extension.

Voice Actions for Chrome uses Chrome's built-in speech recognition, which is under Google's privacy policy.  Additionally, Voice Actions cannot control or be responsible for the privacy implications of pages you open, your web browser, your operating system, or other software on your computer.

## Social media

Updates are posted to [@ChromeVoiceActions on Facebook](https://www.facebook.com/ChromeVoiceActions) and [@ChromeVoice on Twitter](https://twitter.com/ChromeVoice).

Development is supported in part by donations on [ko-fi.com/ZMYaro](https://ko-fi.com/ZMYaro) and [patreon.com/ZMYaro](https://patreon.com/ZMYaro).

## Load the extension for development

1. Clone the repository – `git clone https://github.com/zmyaro/chrome-voice-actions.git`.
2. Open Chrome extension settings (chrome://extensions), enable developer mode, and select “Load unpacked”.
3. Point to `chrome-voice-actions/extension` to install the main extension.

### If you are also working on the hotword add-on:
4. Point to `chrome-voice-actions/hotword_extension` to install the hotword extension.
5. Modify the `scripts/shared.js` in each to point to the other's local extension ID (on their cards at the top of chrome://extensions after you install them unpacked) instead of its Chrome Web Store ID.

## Credits

Voice Actions for Chrome is developed and maintained by Zachary Yaro.

Libraries used:
* [CRX Options Page Boilerplate](https://github.com/ZMYaro/crx-options-page)
* [ExtensionPay](https://extensionpay.com)
* [Material Design icons](https://material.io/resources/icons)
* [MaterialZ](https://materialz.dev)
