var updatePopup = function(callback) {
	chrome.runtime.getBackgroundPage(function(Weasyl) {
		Weasyl.runUpdate(function() {
			Weasyl.Storage.getItem('notifications', function(notifications) {
				for(var key in notifications) {
					var element = document.querySelector('.' + key)
					  , value = notifications[key];

					if (value == 0)
						continue;

					element.parentNode.classList.remove('hidden');
					element.innerText = value;
				}

				if(typeof(callback) == 'function') {
					callback();
				}
			});
		});
	});
};

var updateButton = document.querySelector('.update');

updateButton.addEventListener('click', function() {
	updateButton.innerText = 'Loading...';
	updatePopup(function() {
		updateButton.innerText = 'Refresh now';
	});
});

updatePopup();
