import Logger from '/modules/logger.js';

/**
 * @type {Logger} configuration logger
 */
var LC = {};

/**
 * @type {RegExp} configuration parser and validator
 */
const PARSER = new RegExp('^([!+])?(?:(exact|c|contains|r|regexp)\\\|)?([^|]+)$');

/**
 * @type {RegExp} exact pattern validator
 */
const URL_VALIDATOR = new RegExp('^.*:\/\/.*$');

class BlackUrl {

	/**
	 * Construct Blacklisted URL object used to check URL
	 * 
	 * @param {boolean} all if true, will close all blacklisted urls even opened by users
	 * @param {boolean} onStartup if the blacklist has to be applied on existing tab (on startup)
	 * @param {boolean} exact if the tab's URL has to match exactly the blacklisted URL
	 * @param {boolean} contains if the tab's URL has to contain the blacklisted URL
	 * @param {string} url the blacklisted URL, only used if 'exact' or 'contains' is true (is null in 'regexp' mode)
	 * @param {RegExp} regexp the regular expression used to check the tab's URL (is null in 'exact' or 'contains' mode)
	 */
	constructor(all, onStartup, exact, contains, url, regexp) {
		this.all = all || false;
		this.onStartup = (onStartup == null || typeof onStartup === 'undefined') ? true : onStartup;
		this.exact = exact || false;
		this.contains = contains || false;
		this.url = url || null;
		this.regexp = regexp || null;
    }
    
	/**
	 * @private Private method to set parameters
	 * 
	 * @param {boolean} exact if the tab's URL has to match exactly the blacklisted URL
	 * @param {boolean} contains if the tab's URL has to contain the blacklisted URL
	 * @param {string} url the blacklisted URL, only used if 'exact' or 'contains' is true (is null in 'regexp' mode)
	 * @param {RegExp} regexp the regular expression used to check the tab's URL (is null in 'exact' or 'contains' mode)
	 */
	setParam(exact, contains, url, regexp) {
		this.exact = exact || false;
		this.contains = contains || false;
		this.url = url || null;
		this.regexp = regexp || null;
	}

	/**
	 * Set blacklisted URL in 'exact' mode
	 * 
	 * @param {string} url the backlisted URL
	 * @returns {boolean} if exact URL has been loaded
	 */
	setExact(url) {
		if (URL_VALIDATOR.test(url)) {
			this.setParam(true, false, url, null);
			return true;
		} else {
			LC.error('setExact - exact pattern is invalid, no scheme found: ' + url);
			this.setParam(false, false, null, null);
			return false;
		}
	}

	/**
	 * Set blacklisted URL in 'contains' mode
	 * 
	 * @param {string} url the backlisted URL
	 */
	setContains(url) {
		this.setParam(false, true, url, null);
	}

	/**
	 * Set blacklisted URL in 'regexp' mode
	 * 
	 * @param {string} url the backlisted URL
	 * @returns {boolean} if regular expression has been loaded
	 */
	setRegExp(url) {
		try {
			this.setParam(false, false, null, new RegExp(url));
			return true;
		} catch (e) {
			LC.error('setRegExp - regular expression cannot be parsed: ' + url + ', error: ' + JSON.stringify(e));
			this.setParam(false, false, null, null);
			return false;
		}
	}

	/**
	 * Check if the specified URL is blacklisted
	 * 
	 * @param {string} url URL to check
	 * @returns {boolean} if URL is blacklisted
	 */
	isBlacklisted(url) {
		var blacklisted = false;

		// check exactly the tab's URL against the blacklisted URL
		if (this.exact) {
			if (url == this.url) {
				blacklisted = true;
			}
		}
		// check only if tab's URL contains the blacklisted URL
		else if (this.contains) {
			if (url.includes(this.url)) {
				blacklisted = true;
			}
		}
		// check if tab's URL matches regular expression
		else if (this.regexp.test(url)) {
			blacklisted = true;
		}

		return blacklisted;
	}

	/**
	 * @returns {string} formatted BlackUrl
	 */
	toString() {
		let str = '';

		if (this.all) {
			str += ', applied on all tabs even those opened by user';
		}
		if (this.onStartup) {
			str += ', applied on tabs already opened on startup';
		}

		if (this.exact) {
			str = 'exact check: ' + this.url + str;
		} else if (this.contains) {
			str = 'contains check: ' + this.url + str;
		} else if (this.regexp) {
			str = 'regexp check: ' + this.regexp + str;
		}

		return str;
	}

	/**
	 * Parse policy and add it to blacklist array
	 * 
	 * @param {string} entry policy entry
     * @returns {BlackUrl} created instance
	 */
	static parseAndAdd(entry) {
		var result = PARSER.exec(entry);

		if (result !== null) {

			var onStartup = result[1] !== '!';
			var all = result[1] === '+';
			var mode = result[2] || 'exact';
			var url = result[3];

			if (url.length < 1) {
				LC.error('load - policy URL too short: ' + entry);
				return;
			}

			var blackUrl = new BlackUrl(all, onStartup);

			switch (mode) {
				case 'regexp':
				case 'r':
					if (!blackUrl.setRegExp(url)) {
						return;
					}
					break;
				case 'contains':
				case 'c':
					blackUrl.setContains(url);
					break;
				case 'exact':
				default:
					if (!blackUrl.setExact(url)) {
						return;
					}
			}

            LC.success('load - policy loaded: ' + blackUrl);
            
			return blackUrl;
		} else {
            LC.error('load - policy cannot be loaded: ' + entry);
            
            return;
		}
    }
    
    /**
     * Set the configuration logger
     * 
     * @param {Logger} logger the logger
     */
    static setConfigurationLogger(logger) {
        LC = logger;
    }
}

export default BlackUrl;