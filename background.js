var MakeRequest = {
	BASE_URI: 'https://www.weasyl.com/api',

	generateQueryString: function(params) {
		var str = [];
		for(var p in params) {
			if (params.hasOwnProperty(p)) {
				str.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]));
			}
		}

		return ((params.length == {}) ? '?' : '') + str.join('&');
	},
	handleStateChange: function(xhr, callback) {
		if (xhr.readyState != 4)
			return;

		if (xhr.status == 200) {
			var json;

			try {
				json = JSON.parse(xhr.responseText);

				return callback(null, json);
			} catch (e) {
				callback(e);
			}
		}

		return callback(xhr.status);	
	},
	getResource: function(resource, params, callback) {
		var xhr = new XMLHttpRequest()
		  , resource = MakeRequest.BASE_URI + resource + MakeRequest.generateQueryString(params);

		if (typeof(params) == 'function') {
			callback = params;
			params = {};
		}

		xhr.onreadystatechange = function() {
			MakeRequest.handleStateChange(xhr, callback);
		};

		xhr.open('GET', resource, true);
		xhr.send();
	},
	postResource: function(resource, params, callback) {
		var xhr = new XMLHttpRequest()
		  , resource = MakeRequest.BASE_URI + resource;

		if (typeof(params) == 'function') {
			callback = params;
			params = {};
		}

		xhr.onreadystatechange = function() {
			MakeRequest.handleStateChange(xhr, callback);
		};

		xhr.open('POST', resource, true);
		xhr.send(params);
	}
};

var Storage = {
	getItem: function(key, callback) {
		chrome.storage.local.get(key, function(value) {
			if (value === undefined || value[key] === undefined)
				return callback({});

			var json;

			try {
				json = JSON.parse(value[key]);
				callback(json);
			} catch (e) {
				callback({});
			}
		});
	},
	setItem: function(key, value) {
		var set = {};
		set[key] = JSON.stringify(value);

		chrome.storage.local.set(set, function(){});
	}
};

var Notifications = {
	niceNames: {
		'notifications': 'Notifications',
		'unread_notes': 'Notes',
		'submissions': 'Submissions',
		'journals': 'Journals',
		'comments': 'Comments'
	},

	convertName: function(name) {
		return Notifications.niceNames[name];
	},
	total: function(notifications) {
		var total = 0;

		for(var key in notifications) {
			total += notifications[key];
		}

		return total;
	},
	difference: function(set1, set2) {
		var changes = {};

		for(var key in set2) {
			changes[key] = set2[key] - ((set1[key]) ? set1[key] : 0);
		}

		return changes;
	}
};

var Display = {
	updateUnreadCounter: function(total) {
		if (total == 0)
			return chrome.browserAction.setBadgeText({
				text: ''
			});

		chrome.browserAction.setBadgeText({
			text: '' + total
		});
	},
	displayNotification: function(newNotifications) {
		var items = [];

		for (var key in newNotifications) {
			var changes = newNotifications[key];

			if (changes == 0)
				continue;

			items.push({
				title: Notifications.convertName(key),
				message: changes + ' new ' + Notifications.convertName(key).toLowerCase()
			});
		}

		var notification = {
			type: 'list',
			title: 'New Weasyl Notifications',
			message: 'You have ' + Notifications.total(newNotifications),
			iconUrl: 'weasyl.png',
			items: items
		};

		chrome.notifications.create('', notification, function(){});
	}
};

var n;

var runUpdate = function(callback) {
	MakeRequest.getResource('/messages/summary', function(err, notifications) {
		Storage.getItem('notifications', function(oldNotifications) {
			Storage.setItem('notifications', notifications);

			n = notifications;

			if(typeof(callback) == 'function')
				callback(notifications);

			var currentTotal = Notifications.total(notifications);
			Display.updateUnreadCounter(currentTotal);

			var newNotifications = Notifications.difference(oldNotifications, notifications);
			var totalNewNotifications = Notifications.total(newNotifications);

			if (totalNewNotifications <= 0)
				return;

			console.log('New submissions');

			Display.displayNotification(newNotifications);
		});
	});
};

chrome.alarms.onAlarm.addListener(function(alarm) {
	console.log('Updating notifications');

	runUpdate();
});

chrome.alarms.create('getsubmissions', {
	when: Date.now() + 1000,
	periodInMinutes: 10
});
