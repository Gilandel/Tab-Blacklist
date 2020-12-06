class Logger {

    /**
     * Log levels
     */
    LOG_SUCCESS = 'success';
    LOG_INFO = 'info';
    LOG_WARN = 'warn';
    LOG_ERROR = 'error';

    /**
     * Log modes
     */
    LOG_MODE_CONFIGURATION = 'configuration';
    LOG_MODE_DEBUG = 'debug';

    /**
     * Construct the logger
     * 
     * @param {boolean} enabled if debug is enabled
     * @param {object} port debug port
     * @param {number} tabId debug page identifier
     */
    constructor(enabled, port, tabId){
        this.enabled = enabled || false;
        this.port = port || null;
        this.tabId = tabId || -1;
    }

    /**
     * Dis/Enables logger
     * 
     * @param {boolean} enabled if debug is enabled
     * @param {object} port debug port
     * @param {number} tabId debug page identifier
     */
    setEnabled(enabled, port, tabId) {
        this.enabled = enabled || false;
        this.port = port || this.port;
        this.tabId = tabId || this.tabId;
    }

    /**
     * Logs a message through console or debug page
     * 
     * @param {string|function} input input message or message function supplier
     * @param {string} level log's level (supported: success, info, warn, error ; default: info)
     * @param {string} mode log's mode (supported: configuration, debug ; default: debug)
     */
    log(input, level, mode) {
        if (this.enabled) {
            let message;
            if (typeof input === 'function') {
                message = input();
            } else {
                message = input;
            }

            let prefix;
            if (mode === this.LOG_MODE_CONFIGURATION) {
                prefix = mode;
            } else {
                prefix = this.LOG_MODE_DEBUG;
            }

            if (this.port && this.tabId > -1) {
                if (level !== this.LOG_ERROR && level !== this.LOG_WARN && level !== this.LOG_SUCCESS) {
                    level = this.LOG_INFO;
                }

                this.port.postMessage(prefix + '|' + level + '|' + message);

            } else if (console && console.log) {
                message = prefix + ' - ' + message;

                switch (level) {
                    case this.LOG_ERROR:
                        console.error(message);
                        break;
                    case this.LOG_WARN:
                        console.warn(message);
                        break;
                    case this.LOG_SUCCESS:
                    case this.LOG_INFO:
                    default:
                        console.log(message);
                }
            }
        }
    }

    /**
     * Logs error through console or debug page
     * 
     * @param {string|function} input input message or message function supplier
     * @param {string} mode log's mode (supported: configuration, debug ; default: debug)
     */
    error(input, mode) {
        this.log(input, this.LOG_ERROR, mode);
    }

    /**
     * Logs warning through console or debug page
     * 
     * @param {string|function} input input message or message function supplier
     * @param {string} mode log's mode (supported: configuration, debug ; default: debug)
     */
    warn(input, mode) {
        this.log(input, this.LOG_WARN, mode);
    }

    /**
     * Logs information through console or debug page
     * 
     * @param {string|function} input input message or message function supplier
     * @param {string} mode log's mode (supported: configuration, debug ; default: debug)
     */
    info(input, mode) {
        this.log(input, this.LOG_INFO, mode);
    }

    /**
     * Logs success through console or debug page
     * 
     * @param {string|function} input input message or message function supplier
     * @param {string} mode log's mode (supported: configuration, debug ; default: debug)
     */
    success(input, mode) {
        this.log(input, this.LOG_SUCCESS, mode);
    }
}

export default Logger;