var REGEX = new RegExp('^(?:(configuration|debug)\\|)?(success|info|warn|error)\\|(.*)$');

var PORT = chrome.runtime.connect({ name: chrome.runtime.id });

if (PORT) {
    console.log('Connected to: ' + chrome.runtime.id);

    var configurations = [];
    var debugs = [];

    PORT.onMessage.addListener((msg) => {
        console.log(msg);

        if (msg) {
            let results = REGEX.exec(msg);

            if (results !== null) {
                let debug = results[1] !== 'configuration';
                let message = {'date': new Date(), 'level': results[2], 'message': results[3]};

                let messages;
                let div;
                if (debug) {
                    configurations.push(message);
                    messages = configurations;
                    div = document.getElementById('debug');
                } else {
                    debugs.push(message);
                    messages = debugs;
                    div = document.getElementById('configuration');
                }

                if (messages.length > 50) {
                    messages.shift();
                }

                let content = '';
                messages.forEach(m => {
                    content = '<span class="' + m.level + '">' + m.date.toISOString() + ' - ' + m.message + '</span>\n' + content;
                });

                div.innerHTML = content;
            }
        }
    });
} else {
    console.log('Connot connect to: ' + chrome.runtime.id);
}