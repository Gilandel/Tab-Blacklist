import Logger from '/modules/logger.js';
import BlackUrl from '/modules/blackurl.js';

/**
 * @type {Logger} global logger
 */
var L = {};

class Configuration {

    /**
     * @type {boolean} Init default debug mode
     */
    DEBUG = false;

    /**
     * @type {Array.<BlackUrl>} Array of BlackUrl object
     */
    BLACKLIST = [];

    /**
     * Load storage data
     * 
     * @param {function} callbackDebug called if managed storage contains data
     * @param {function} callbackPostConfig called after blacklist reload
     */
    load(callbackDebug, callbackPostConfig) {
        // Reset
        this.BLACKLIST.length = 0;
        this.DEBUG = false;

        chrome.storage.managed.get(['Debug', 'BlacklistUrls'], (results) => {

            if (results) {

                // Load debug mode
                this.DEBUG = results.Debug || this.DEBUG;

                L.setEnabled(this.DEBUG);

                // Load blacklisted URLs configuration
                let callbackBlacklist = () => {
                    if (results.BlacklistUrls && results.BlacklistUrls.length > 0) {

                        results.BlacklistUrls.forEach(url => {
                            let blackUrlObj = BlackUrl.parseAndAdd(url);

                            if (blackUrlObj) {
                                this.BLACKLIST.push(blackUrlObj);
                            }
                        });
                    } else {
                        L.warn('load - no policies found', L.LOG_MODE_CONFIGURATION);
                    }

                    if (typeof callbackPostConfig === 'function') {
                        callbackPostConfig();
                    }
                };

                if (typeof callbackDebug === 'function') {
                    callbackDebug(callbackBlacklist);
                } else {
                    callbackBlacklist();
                }
            } else if (typeof callbackDebug === 'function') {
                callbackDebug();
            }
        });
    }
     
    /**
     * Set the logger
     * 
     * @param {Logger} logger the logger
     */
    static setLogger(logger) {
        L = logger;
    }
}

export default Configuration;