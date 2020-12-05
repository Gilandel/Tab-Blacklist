/**
 * configuration parser and validator
 */
const PARSER = new RegExp('^([!+])?(?:(exact|c|contains|r|regexp)\\\|)?([^|]+)$');

class BlackUrl {

	/**
	 * Construct Blacklisted URL object used to check URL
	 * 
	 * @param {boolean} all if true, will close all blacklisted urls even opened by users
	 * @param {boolean} onInstalled if the blacklist has to be applied on existing tab (before installation)
	 * @param {boolean} exact if the tab's URL has to match exactly the blacklisted URL
	 * @param {boolean} contains if the tab's URL has to contain the blacklisted URL
	 * @param {string} url the blacklisted URL, only used if 'exact' or 'contains' is true (is null in 'regexp' mode)
	 * @param {RegExp} regexp the regular expression used to check the tab's URL (is null in 'exact' or 'contains' mode)
	 */
	constructor(all, onInstalled, exact, contains, url, regexp) {
		this.all = all || false;
		this.onInstalled = onInstalled || true;
		this.exact = exact || false;
		this.contains = contains || false;
		this.url = url || null;
		this.regexp = regexp || null;
	}

	/**
	 * Set blacklisted URL in 'exact' mode
	 * 
	 * @param {string} url the backlisted URL
	 */
	set setExact (url) {
		this.url = url;
		this.exact = true;

		this.regexp = null;
		this.contains = false;
	}

	/**
	 * Set blacklisted URL in 'contains' mode
	 * 
	 * @param {string} url the backlisted URL
	 */
	set setContains (url) {
		this.url = url;
		this.contains = true;

		this.regexp = null;
		this.exact = false;
	}

	/**
	 * Set blacklisted URL in 'regexp' mode
	 * 
	 * @param {string} url the backlisted URL
	 */
	set setRegExp (url) {
		this.regexp = new RegExp(url);

		this.url = null;
		this.exact = false;
		this.contains = false;
	}
}

/**
 * Array of BlackUrl object
 */
var BLACKLIST = [];
/**
 * Variable to store current active tab
 */
var LAST_ACTIVE_TAB = {};

/**
 * Load storage data
 */
function load() {
	BLACKLIST.length = 0;

	chrome.storage.managed.get('BlacklistUrls', function (results) {

		if (results && results.BlacklistUrls && results.BlacklistUrls.length > 0) {

			results.BlacklistUrls.forEach(function (entry) {

				var result = PARSER.exec(entry);

				if (result !== null) {

					var onInstalled = result[1] !== '!';
					var all = result[1] === '+';
					var mode = result[2] || 'exact';
					var url = result[3];

					var blackUrl = new BlackUrl(all, onInstalled);

					switch (mode) {
						case 'regexp':
						case 'r':
							blackUrl.setRegExp(url);
							break;
						case 'contains':
						case 'c':
							blackUrl.setContains(url);
							break;
						case 'exact':
						default:
							blackUrl.setExact(url);
					}

					BLACKLIST.push(blackUrl);
				}
			});
		}
	});
}

/**
 * Check if the specified URl is blacklisted
 * 
 * @param {string} url URL to check
 * @param {BlackUrl} blackUrl blacklist object used to check
 * @returns {boolean} if URL is blacklisted
 */
function isBlacklisted(url, blackUrl) {
	var blacklisted = false;

	// check exactly the tab's URL against the blacklisted URL
	if (blackUrl.exact) {
		if (url == blackUrl.url) {
			blacklisted = true;
		}
	}
	// check only if tab's URL contains the blacklisted URL
	else if (blackUrl.contains) {
		if (url.includes(blackUrl.url)) {
			blacklisted = true;
		}
	}
	// check if tab's URL matches regular expression
	else if (blackUrl.regexp.test(url)) {
		blacklisted = true;
	}

	return blacklisted;
}

/**
 * Remove tab if blacklisted and try to refocus on previous active tab
 * 
 * @param {chrome.tabs.Tab} tab tab object updated
 * @param {BlackUrl} blackUrl blacklist object used to check
 * @returns {boolean} if tab has been removed
 */
function removeTab(tab, blackUrl) {

	var url = tab.url || tab.pendingUrl;

	// try to remove the blacklisted tab
	if (isBlacklisted(url, blackUrl)) {

		if (LAST_ACTIVE_TAB && LAST_ACTIVE_TAB.id != null) {

			chrome.tabs.update(LAST_ACTIVE_TAB.id, { active: true }, function (tab) {

				// on error, just let chrome define active tab
				if (chrome.runtime.lastError) {
					return;
				}
			});
		}

		chrome.tabs.remove(tab.id, function () {
			if (chrome.runtime.lastError) {
				return;
			}
		});

		return true;
	}
}

/**
 * Manage creation tab event and try to close them if blacklisted
 * 
 * @param {chrome.tabs.Tab} tab tab object updated
 * @param {boolean} onInstalled if it's a tab present before installation
 */
function onCreated(tab, onInstalled) {
	if (chrome.runtime.lastError) {
		return;
	}

	BLACKLIST.forEach(function (blackUrl) {

		// Only remove if not during installation or if during installation is enabled
		if (onInstalled == null || typeof onInstalled === 'undefined' || blackUrl.onInstalled == onInstalled) {

			if (removeTab(tab, blackUrl)) {
				return;
			}
		}
	});
}

/**
 * Try to update the variable with the current active tab and remove blacklisted URL
 * 
 * @param {chrome.tabs.Tab} tab tab object updated
 */
function updateActive(tab) {
	if (chrome.runtime.lastError) {
		return;
	}

	var removed = false;

	BLACKLIST.filter(function (blackUrl) {
		return blackUrl.all;
	}).forEach(function (blackUrl) {

		if (removeTab(tab, blackUrl)) {
			removed = true;
			return;
		}
	});

	if (!removed) {
		chrome.tabs.get(tab.id, function (tab) {
			if (chrome.runtime.lastError) {
				return;
			}

			LAST_ACTIVE_TAB = tab;
		});
	}
}

/**
 * Manage activated tab event
 * 
 * @param {{tabId: integer, windowId: integer}} info information on active tab
 */
function onActivated(info) {
	chrome.tabs.get(info.tabId, updateActive);
}

/**
 * Manage active tab through tabs update event
 * 
 * @param {integer} tabId tab identifier
 * @param {object} changeInfo object containing changes (see: https://developer.chrome.com/extensions/tabs#event-onUpdated)
 * @param {chrome.tabs.Tab} tab tab object updated
 */
function onUpdated(tabId, changeInfo, tab) {
	if (tab.active) {
		updateActive(tab);
	}
}

/**
 * Load storage information
 */
load();

/**
 * Manage storage changement event (reloaded policies)
 */
if (typeof chrome.storage.managed.onChanged !== 'undefined') {
	chrome.storage.managed.onChanged.addListener(function (changes, namespace) {
		load();
	});
}

/**
 * Manage closing tab event
 */
chrome.tabs.onCreated.addListener(onCreated);

/**
 * Manage at startup, the current or first active tab
 */
chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
	if (chrome.runtime.lastError) {
		return;
	}

	// we try to remove first tab ^^, replace with another url ?
	updateActive(tabs[0]);
});

/**
 * Manage activated tab event
 */
chrome.tabs.onActivated.addListener(onActivated);

/**
 * Manage active tab through tabs update event
 */
chrome.tabs.onUpdated.addListener(onUpdated);

/**
 * On extension initialization, remove previously opened blacklisted URLs
 */
chrome.runtime.onInstalled.addListener(function () {
	chrome.windows.getAll({ populate: true }, function (windows) {
		windows.forEach(function (window) {
			window.tabs.forEach(function (tab) {
				onCreated(tab, true);
			});
		});
	});
});