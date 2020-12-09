import Logger from '/modules/logger.js';
import Configuration from '/modules/configuration.js';

/**
 * @type {Logger} global logger
 */
var L = {};

/**
 * @type {Logger} configuration logger
 */
var LC = {};

/**
 * @type {Configuration} The main configuration
 */
var C = {};

class Debug {

    /**
     * Init debug page
     */
    DEBUG_LISTENER = null;
    DEBUG_PORT = null;
    DEBUG_PORT_LISTENER = null;

    /**
     * The debug tab identifier
     */
    DEBUG_TAB_ID = -1;
    DEBUG_TAB_WINDOW_ID = -1;

    /**
     * Dis/Enables loggers
     * 
     * @param {boolean} enabled if debug is enabled
     * @param {object} port debug port
     * @param {number} tabId debug page identifier
     */
    setLoggersEnabled(enabled, port, tabId) {
        L.setEnabled(enabled, port, tabId);
        LC.setEnabled(enabled, port, tabId);
    }

    /**
     * Un/Load debug page
     * 
     * @param {function} callbackBlacklist function called after debug page connection is established
     */
    callbackDebug(callbackBlacklist) {
        L.info('Debug mode: ' + C.DEBUG);

        if (C.DEBUG) {
            if (this.DEBUG_LISTENER && this.DEBUG_PORT && this.DEBUG_PORT_LISTENER && this.DEBUG_TAB_ID > -1) {
                if (typeof callbackBlacklist === 'function') {
                    LC.info('Reloading configuration...');

                    callbackBlacklist();
                }
            } else {
                chrome.tabs.create({ 'url': 'debug.html' }, (tab) => {
                    this.DEBUG_TAB_ID = tab.id;
                    this.DEBUG_TAB_WINDOW_ID = tab.windowId;

                    this.DEBUG_LISTENER = (port) => {
                        if (port.name == chrome.runtime.id) {
                            this.DEBUG_PORT = port;

                            this.setLoggersEnabled(C.DEBUG, this.DEBUG_PORT, this.DEBUG_TAB_ID);

                            this.DEBUG_PORT_LISTENER = (msg) => {
                                L.info(msg);
                            };

                            this.DEBUG_PORT.onDisconnect.addListener(() => {
                                L.info('Debug Port disconnected');

                                if (this.DEBUG_PORT_LISTENER) {
                                    this.DEBUG_PORT.onMessage.removeListener(this.DEBUG_PORT_LISTENER);
                                    this.DEBUG_PORT_LISTENER = null;
                                }
                                this.DEBUG_PORT = null;

                                this.setLoggersEnabled(C.DEBUG, null);
                            });

                            this.DEBUG_PORT.onMessage.addListener(this.DEBUG_PORT_LISTENER);

                            LC.success('Connected to background');
                        } else {
                            this.DEBUG_PORT = null;
                            this.DEBUG_PORT_LISTENER = null;

                            this.setLoggersEnabled(C.DEBUG, null);
                        }

                        if (typeof callbackBlacklist === 'function') {
                            LC.info('Loading configuration...');

                            callbackBlacklist();
                        }
                    };

                    chrome.runtime.onConnect.addListener(this.DEBUG_LISTENER);
                });
            }
        }
        // try to clear connection if not in debug mode
        else {
            if (this.DEBUG_PORT) {
                if (this.DEBUG_PORT_LISTENER) {
                    this.DEBUG_PORT.onMessage.removeListener(this.DEBUG_PORT_LISTENER);
                    this.DEBUG_PORT_LISTENER = null;
                }
                this.DEBUG_PORT.disconnect();
                this.DEBUG_PORT = null;
                this.setLoggersEnabled(C.DEBUG, null, -1);
            }

            if (this.DEBUG_LISTENER) {
                chrome.runtime.onConnect.removeListener(this.DEBUG_LISTENER);
                this.DEBUG_LISTENER = null;
            }

            if (this.DEBUG_TAB_ID > -1) {
                chrome.tabs.remove(this.DEBUG_TAB_ID, () => {
                    if (chrome.runtime.lastError) {
                        return;
                    }

                    this.DEBUG_TAB_ID = -1;
                    this.DEBUG_TAB_WINDOW_ID = -1;
                    this.setLoggersEnabled(C.DEBUG, null, -1);
                });
            }

            if (typeof callbackBlacklist === 'function') {
                callbackBlacklist();
            }
        }
    }

    /**
     * Set the logger
     * 
     * @param {Logger} logger the logger
     */
    static setLogger(logger) {
        L = logger;
    }

    /**
     * Set the configuration logger
     * 
     * @param {Logger} logger the logger
     */
    static setConfigurationLogger(logger) {
        LC = logger;
    }

    /**
     * Set the configuration
     * 
     * @param {Configuration} configuration the configuration
     */
    static setConfiguration(configuration) {
        C = configuration;
    }
}

export default Debug;