/**
 * configuration parser and validator
 */
const PARSER = new RegExp('^(?:(!)?(c|r|exact|regexp|contains)\\\|)?([^|]+)$');

/**
 * Array of blacklist object
 * 
 * [{
 * onInstalled: boolean => if the blacklist has to be applied on existing tab (before installation)
 * exact: boolean => if the tab's URL has to match exactly the blacklisted URL
 * contains: boolean => if the tab's URL has to contain the blacklisted URL
 * url: string => the blacklisted URL, only used if 'exact' or 'contains' is true
 * regexp: regexp => the regular expression used to check the tab's URL
 * }]
 */
var blacklist = [];
/**
 * Variable to store current active tab
 */
var lastActiveTab = {};

/**
 * Load storage data
 */
function load() {
	blacklist.length = 0;
	
	chrome.storage.managed.get('BlacklistUrls', function(results) {
		
		results.BlacklistUrls.forEach(function(entry) {
			
			var result = PARSER.exec(entry);
			
			if (result !== null) {
				
				var onInstalled = result[1] !== '!';
				var mode = result[2] || 'exact';
				var url = result[3];
			
				var black = {
					onInstalled: onInstalled,
					exact: false,
					contains: false,
					url: url
				};
				
				switch (mode) {
					case 'regexp':
					case 'r':
						black.regexp = new RegExp(url);
						break;
					case 'contains':
					case 'c':
						black.contains = true;
						break;
					case 'exact':
					default:
						black.exact = true;
				}
				
				blacklist.push(black);
			}
		});
	});
};

/**
 * Manage creation tab event and try to close them if blacklisted
 * 
 * @param {chrome.tabs.Tab} tab tab object updated
 * @param {boolean} onInstalled if it's a tab present before installation
 */
function removeTab(tab, onInstalled) {
	
	var url = tab.url || tab.pendingUrl;
	
	blacklist.forEach(function(black) {
		var remove = false;
		
		// Only remove if not during installation or if enabled during installation
		if (onInstalled == null || typeof onInstalled === 'undefined' || black.onInstalled == onInstalled) {
			
			// check exactly the tab's URL against the blacklisted URL
			if (black.exact) {
				if (url == black.url) {
					remove = true;
				}
			}
			// check only if tab's URL contains the blacklisted URL
			else if (black.contains) {
				if(url.includes(black.url)) {
					remove = true;
				}
			}
			// check if tab's URL matches regular expression
			else if (black.regexp.test(url)) {
				remove = true;
			}
		}
		
		// try to remove the blacklisted tab
		if (remove) {
			if (lastActiveTab && lastActiveTab.id != null) {
				chrome.tabs.update(lastActiveTab.id, {active: true});
			}
			chrome.tabs.remove(tab.id);
			return;
		}
	});
};

/**
 * Try to update the variable with the current active tab
 * 
 * @param {chrome.tabs.Tab} tab tab object updated
 */
function updateActive(tab) {
	if (chrome.runtime.lastError) {
		return;
	}

	lastActiveTab = tab;
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
 * @param {object} changeInfo object containing changes
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
	chrome.storage.managed.onChanged.addListener(function(changes, namespace) {
		load();
	});
}

/**
 * Manage closing tab event
 */
chrome.tabs.onCreated.addListener(removeTab);

/**
 * Manage at startup, the current or first active tab
 */
chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
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
chrome.runtime.onInstalled.addListener(function() {
    chrome.windows.getAll({ populate: true }, function(windows) {
        windows.forEach(function(window) {
			window.tabs.forEach(function(tab) {
				removeTab(tab, true);
			});
		});
    });
});