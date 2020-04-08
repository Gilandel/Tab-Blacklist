const PARSER = new RegExp('^(?:(c|r|exact|regexp|contains)\\\|)?([^|]+)$');

var blacklist = [];
var lastActiveTab = {};

var load = function() {
	blacklist.length = 0;
	
	chrome.storage.managed.get('BlacklistUrls', function(results) {
		
		results.BlacklistUrls.forEach(function(entry) {
			
			var result = PARSER.exec(entry);
			
			if (result !== null) {
				
				var mode = result[1] || 'exact';
				var url = result[2];
			
				var black = {
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

load();

chrome.storage.managed.onChanged.addListener(function(changes, namespace) {
	load();
});

chrome.tabs.onCreated.addListener(function(tab) {
	
	var url = tab.url || tab.pendingUrl;
	
	blacklist.forEach(function(black) {
		var remove = false;
		
		if (black.exact) {
			if (url == black.url) {
				remove = true;
			}
		} else if (black.contains) {
			if(url.includes(black.url)) {
				remove = true;
			}
		} else if (black.regexp.test(url)) {
			remove = true;
		}
		
		if (remove) {
			if (lastActiveTab?.id != null) {
				chrome.tabs.update(lastActiveTab.id, {active: true});
			}
			chrome.tabs.remove(tab.id);
			return;
		}
	});
});

function updateActive(tab) {
	if (!chrome.runtime.lastError) {
		lastActiveTab = tab;
	}
}

function onActivated(info) {
	chrome.tabs.get(info.tabId, updateActive);
}

function onUpdated(info, tab) {
	if (tab.active) {
		updateActive(tab);
	}
}

chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
	updateActive(tabs[0]);
});

chrome.tabs.onActivated.addListener(onActivated);

chrome.tabs.onUpdated.addListener(onUpdated);
