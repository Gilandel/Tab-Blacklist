import Logger from '/modules/logger.js';
import BackUrl from '/modules/blackurl.js';
import Configuration from '/modules/configuration.js';
import Debug from '/modules/debug.js';

/**
 * @type {Logger} Initialize global logger and inject it
 */
var L = new Logger('debug');
Configuration.setLogger(L);
Debug.setLogger(L);

/**
 * @type {Logger} Initialize configuration logger and inject it
 */
var LC = new Logger('configuration');
BackUrl.setConfigurationLogger(LC);
Configuration.setConfigurationLogger(LC);
Debug.setConfigurationLogger(LC);

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
 * Event origins
 */
var EVENT_INIT = 0;
var EVENT_CREATION = 1;
var EVENT_UPDATE = 2;
var EVENT_STORAGE = 3;
var EVENTS = ['init', 'onCreated', 'onUpdated', 'updateStorage'];

/**
 * Remove tab if blacklisted and try to refocus on previous active tab
 * 
 * @param {number} tabId tab identifier
 * @param {string} url tab's URL
 * @param {BlackUrl} blackUrl blacklist object used to check
 * @returns {boolean} if tab has been removed
 */
let removeTab = (tabId, url, blackUrl) => {

	// try to remove the blacklisted tab
	if (blackUrl.isBlacklisted(url) && REMOVING_TAB_ID !== tabId) {
		REMOVING_TAB_ID = tabId;

		L.info('removeTab - URL is blacklisted: ' + url);

		if (LAST_ACTIVE_TAB_ID === tabId) {
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

		chrome.tabs.remove(tabId, () => {
			if (chrome.runtime.lastError) {
				L.error('removeTab - Removing tab failed: ' + tabId);
			} else {
				L.success('removeTab - Tab removed: ' + tabId);
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
 * @param {number} fromEvent description of event origin
 */
let onEvent = (tab, fromEvent) => {
	if (chrome.runtime.lastError) {
		return;
	}

	var url = tab.url || tab.pendingUrl;

	if (typeof url !== 'undefined') {
		var removed = false;

		let onStartup = fromEvent === EVENT_INIT;
		let notOpenedByUser = (fromEvent === EVENT_CREATION && (tab.openerTabId === null || typeof tab.openerTabId === 'undefined'));

		L.info('onEvent(' + EVENTS[fromEvent] + ') - Validate tab: ' + tab.id + ', url: ' + url + ', onStartup: ' + onStartup + ', opened by user: ' + !notOpenedByUser);

		C.BLACKLIST.every((blackUrl) => {

			// Only remove if not during startup or if in all cases
			if (blackUrl.all || (onStartup && blackUrl.onStartup) || notOpenedByUser) {

				if (removeTab(tab.id, url, blackUrl)) {
					return false;
				}
			}

			return true;
		});

		if (!removed && REMOVING_TAB_ID !== tab.id && typeof tab.id !== 'undefined') {
			L.success('onEvent(' + EVENTS[fromEvent] + ') - Reset active tab, id: ' + tab.id + ', title: ' + tab.title);
			LAST_ACTIVE_TAB_ID = tab.id;
		} else {
			LAST_ACTIVE_TAB_ID = -1;
		}
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
		LC.setEnabled(C.DEBUG, null, -1);
	}
};

/**
 * Post load, reload or startup, analyze all tabs
 * 
 * @param {number} fromEvent description of event origin
 * @returns {function} callback function
 */
let analyzeAllTabs = (fromEvent) => {
	return () => {
		chrome.windows.getAll({ populate: true }, (windows) => {
			windows.forEach((window) => {
				window.tabs.forEach((tab) => onEvent(tab, fromEvent));
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
		LC.info('storageUpdate - Reloading managed policies');

		C.load(callback => D.callbackDebug(callback), analyzeAllTabs(EVENT_STORAGE));
	}
};

/**
 * Manage storage changes event (reloaded policies)
 */
chrome.storage.onChanged.addListener(storageUpdate);

/**
 * Manage closing tab event
 */
chrome.tabs.onCreated.addListener(tab => onEvent(tab, EVENT_CREATION));

/**
 * Manage activated tab event
 */
chrome.tabs.onActivated.addListener(onActivated);

/**
 * Manage active tab through tabs update event
 */
chrome.tabs.onUpdated.addListener((tabId, changes, tab) => onEvent(tab, EVENT_UPDATE));

/**
 * Manage tab closing, try to detect debug page closing
 */
chrome.tabs.onRemoved.addListener(onRemoved);

/**
 * Load storage and init
 */
C.load(callback => D.callbackDebug(callback), analyzeAllTabs(EVENT_INIT));