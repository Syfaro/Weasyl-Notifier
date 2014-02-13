var Weasyl = chrome.extension.getBackgroundPage();

var updatePopup = function() {
	var notifications = Weasyl.n;

	for(var key in notifications) {
		var element = document.querySelector('.' + key)
		  , value = notifications[key];

		console.log(element);

		if (value == 0)
			continue;

		element.parentNode.classList.remove('hidden');
		element.innerText = value;
	}
};

var updateButton = document.querySelector('.update');

updateButton.addEventListener('click', function() {
	updateButton.innerText = 'Loading...';
	Weasyl.runUpdate(function() {
		updatePopup();
		updateButton.innerText = 'Refresh now';
	});
});

updatePopup();
