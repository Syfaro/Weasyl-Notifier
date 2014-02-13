var getItems = function(callback) {
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200) {
			callback(JSON.parse(xhr.responseText));
		}
	}

	xhr.open('GET', 'https://www.weasyl.com/api/messages/summary', true);
	xhr.send();
};

var getCurrentItems = function(callback) {
	chrome.storage.sync.get('notifications', function(notifications) {
		callback((notifications.notifications) ? JSON.parse(notifications.notifications) : {});
	});
};

var saveCurrentItems = function(actual) {
	chrome.storage.sync.set({notifications: JSON.stringify(actual)});
};

var areNewNotifications = function(current, actual) {
	if(current.comments < actual.comments ||
		current.journals < actual.journals ||
		current.notifications < actual.notifications ||
		current.submissions < actual.submissions ||
		current.unread_notes < actual.unread_notes) {
		return true;
	}

	return false;
};

var newNotifications = function(current, actual) {
	return {
		journals: actual.journals - ((current.journals) ? current.journals : 0),
		comments: actual.comments - ((current.comments) ? current.comments : 0),
		notifications: actual.notifications - ((current.notifications) ? current.notifications : 0),
		submissions: actual.submissions - ((current.submissions) ? current.submissions : 0),
		unread_notes: actual.unread_notes - ((current.unread_notes) ? current.unread_notes : 0)
	};
};

var dispatchCheck = function() {
	console.log('Starting check');

	getCurrentItems(function(current) {
		getItems(function(actual) {
			areNew = areNewNotifications(current, actual);

			if(areNew) {
				displayAlert(newNotifications(current, actual));
			}

			updateTotalUnread(actual);

			saveCurrentItems(actual);
		});
	});
};


var convertToNiceName = function(item) {
	var niceNames = {
		'notifications': 'Notifications',
		'unread_notes': 'Notes',
		'submissions': 'Submissions',
		'journals': 'Journals',
		'comments': 'Comments'
	};

	return niceNames[item];
};

var displayAlert = function(newItems) {
	var total = newItems.journals + newItems.comments + newItems.notifications + newItems.submissions + newItems.unread_notes;

	var items = [];

	for(var key in newItems) {
		var item = newItems[key];

		if(item != 0) {
			items.push({
				title: convertToNiceName(key),
				message: '' + item
			});
		}
	}

	var opt = {
		type: 'list',
		title: 'Weasyl Submissions',
		message: 'You have ' + total + ' new notifications on Weasyl!',
		iconUrl: 'weasyl.png',
		items: items
	};

	chrome.notifications.create('', opt, function() {
		console.log('Sent notification');
	});
};

var updateTotalUnread = function(actual) {
	var total = 
		((actual.journals) ? actual.journals : 0) + 
		((actual.comments) ? actual.comments : 0) + 
		((actual.notifications) ? actual.notifications : 0) + 
		((actual.submissions) ? actual.submissions : 0) + 
		((actual.unread_notes) ? actual.unread_notes : 0);

	if(total == 0)
		return;

	chrome.browserAction.setBadgeText({
		text: '' + total
	});
};

chrome.alarms.create('getsubmissions', {
	when: Date.now(),
	periodInMinutes: 5,
});

chrome.alarms.onAlarm.addListener(function(alarm) {
	dispatchCheck();
});