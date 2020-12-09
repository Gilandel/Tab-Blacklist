class Logger {

    /**
     * Log levels
     */
    LOG_SUCCESS = 'success';
    LOG_INFO = 'info';
    LOG_WARN = 'warn';
    LOG_ERROR = 'error';

    /**
     * Construct the logger
     * 
     * @param {string} name logger name
     * @param {boolean} enabled if debug is enabled
     * @param {object} port debug port
     * @param {number} tabId debug page identifier
     */
    constructor(name, enabled, port, tabId) {
        this.name = name || 'default';
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
     */
    log(input, level) {
        if (this.enabled) {
            let message;
            if (typeof input === 'function') {
                message = input();
            } else {
                message = input;
            }

            if (this.port && this.tabId > -1) {
                if (level !== this.LOG_ERROR && level !== this.LOG_WARN && level !== this.LOG_SUCCESS) {
                    level = this.LOG_INFO;
                }

                this.port.postMessage(this.name + '|' + level + '|' + message);

            } else if (console && console.log) {
                message = this.name + ' - ' + message;

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
     */
    error(input) {
        this.log(input, this.LOG_ERROR);
    }

    /**
     * Logs warning through console or debug page
     * 
     * @param {string|function} input input message or message function supplier
     */
    warn(input) {
        this.log(input, this.LOG_WARN);
    }

    /**
     * Logs information through console or debug page
     * 
     * @param {string|function} input input message or message function supplier
     */
    info(input) {
        this.log(input, this.LOG_INFO);
    }

    /**
     * Logs success through console or debug page
     * 
     * @param {string|function} input input message or message function supplier
     */
    success(input) {
        this.log(input, this.LOG_SUCCESS);
    }
}

export default Logger;