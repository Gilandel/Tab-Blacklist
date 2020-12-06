import Logger from '/modules/logger.js';
import BackUrl from '/modules/blackurl.js';
import Configuration from '/modules/configuration.js';
import Debug from '/modules/debug.js';

/**
 * @type {Logger} Initialize logger and inject it
 */
var L = new Logger();
BackUrl.setLogger(L);
Configuration.setLogger(L);
Debug.setLogger(L);

/**
 * @type {Configuration} The main configuration
 */
var C = new Configuration();
Debug.setConfiguration(C);

/**
 * @type {Debug} Debug manager
 */
var D = new Debug();

/**
 * Variable to store current active tab identifier
 */
var LAST_ACTIVE_TAB_ID = -1;

/**
 * Variable to store tab identifier currently removed
 */
var REMOVING_TAB_ID = -1;

/**
 * Remove tab if blacklisted and try to refocus on previous active tab
 * 
 * @param {chrome.tabs.Tab} tab tab object updated
 * @param {BlackUrl} blackUrl blacklist object used to check
 * @returns {boolean} if tab has been removed
 */
let removeTab = (tab, blackUrl) => {

	var url = tab.url || tab.pendingUrl;

	// try to remove the blacklisted tab
	if (blackUrl.isBlacklisted(url) && REMOVING_TAB_ID !== tab.id) {
		REMOVING_TAB_ID = tab.id;

		L.info('removeTab - URL is blacklisted: ' + url);

		if (LAST_ACTIVE_TAB_ID === tab.id) {
			LAST_ACTIVE_TAB_ID = -1;
		}

		if (LAST_ACTIVE_TAB_ID > -1) {

			chrome.tabs.update(LAST_ACTIVE_TAB_ID, { active: true }, (tab) => {
				// on error, just let chrome define active tab
				if (chrome.runtime.lastError) {
					L.error('removeTab - Refocus tab failed: ' + LAST_ACTIVE_TAB_ID);
					LAST_ACTIVE_TAB_ID = -1;

				} else {
					L.success('removeTab - Tab refocused: ' + LAST_ACTIVE_TAB_ID);
				}
			});
		}

		chrome.tabs.remove(tab.id, () => {
			if (chrome.runtime.lastError) {
				L.error('removeTab - Removing tab failed: ' + tab.id);
			} else {
				L.success('removeTab - Tab removed: ' + tab.id);
			}

			REMOVING_TAB_ID = -1;
		});

		// returns true even if chrome removes tab asynchronously
		// so we should use a promise but for now, we just want to know if the task has been started
		// and if the input URL is blacklisted
		return true;
	} else {
		return false;
	}
};

/**
 * Manage tab event and try to close them if blacklisted
 * 
 * @param {chrome.tabs.Tab} tab tab object updated
 * @param {boolean} onStartup if it's a tab present before startup
 */
let onEvent = (tab, onStartup) => {
	if (chrome.runtime.lastError) {
		return;
	}

	var removed = false;

	C.BLACKLIST.every((blackUrl) => {

		// Only remove if not during startup or if in all cases
		if (blackUrl.onStartup == onStartup || blackUrl.all) {

			if (removeTab(tab, blackUrl)) {
				return false;
			}
		}

		return true;
	});

	if (!removed && REMOVING_TAB_ID !== tab.id && typeof tab.id !== 'undefined') {
		L.success('onEvent - Reset active tab, id: ' + tab.id + ', title: ' + tab.title);
		LAST_ACTIVE_TAB_ID = tab.id;
	} else {
		LAST_ACTIVE_TAB_ID = -1;
	}
};

/**
 * Manage activated tab event
 * 
 * @param {{tabId: number, windowId: number}} info information on active tab
 */
let onActivated = (info) => {
	if (REMOVING_TAB_ID !== info.tabId) {
		if (C.DEBUG) {
			chrome.tabs.get(info.tabId, tab => {
				if (chrome.runtime.lastError) {
					L.error('onActivated - Activating tab failed: ' + tab.id);
				} else {
					L.success('onActivated - Active tab: ' + tab.id + ', title: ' + tab.title);
				}
			});
		}

		LAST_ACTIVE_TAB_ID = info.tabId
	}
};

/**
 * Manage debug tab closing
 * 
 * @param {number} tabId the tab identifier
 * @param {{windowId: number, isWindowClosing: boolean}} removeInfo the removed info
 */
let onRemoved = (tabId, removeInfo) => {
	if (tabId == D.DEBUG_TAB_ID || (removeInfo.isWindowClosing && removeInfo.windowId == D.DEBUG_TAB_WINDOW_ID)) {

		// Reset debug info and logger
		D.DEBUG_TAB_ID = -1;
		D.DEBUG_TAB_WINDOW_ID = -1;
		L.setEnabled(C.DEBUG, null, -1);
	}
};

/**
 * Post load, reload or startup, analyze all tabs
 * 
 * @param {boolean} onStartup if it's a tab present before startup
 * @returns {function} callback function
 */
let analyzeAllTabs = (onStartup) => {
	return () => {
		chrome.windows.getAll({ populate: true }, (windows) => {
			windows.forEach((window) => {
				window.tabs.forEach((tab) => onEvent(tab, onStartup));
			});
		});
	};
};

/**
 * Manage reloading policies
 * 
 * @param {{oldValue: any, newValue: any}} changes https://developer.chrome.com/extensions/storage#type-StorageChange
 * @param {string} namespace the event namespace (one of: sync, local, managed)
 */
let storageUpdate = (changes, namespace) => {
	if (namespace === 'managed') {
		L.info('storageUpdate - Reloading managed policies', L.LOG_MODE_CONFIGURATION);

		C.load(callback => D.callbackDebug(callback), analyzeAllTabs(false));
	}
};

/**
 * Manage storage changes event (reloaded policies)
 */
chrome.storage.onChanged.addListener(storageUpdate);

/**
 * Manage closing tab event
 */
chrome.tabs.onCreated.addListener(tab => onEvent(tab, false));

/**
 * Manage activated tab event
 */
chrome.tabs.onActivated.addListener(onActivated);

/**
 * Manage active tab through tabs update event
 */
chrome.tabs.onUpdated.addListener(tab => onEvent(tab, false));

/**
 * Manage tab closing, try to detect debug page closing
 */
chrome.tabs.onRemoved.addListener(onRemoved);

/**
 * Load storage and init
 */
C.load(callback => D.callbackDebug(callback), analyzeAllTabs(true));