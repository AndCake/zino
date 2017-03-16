(function() {
	'use strict';

	var comments = [];

	// initially load the comments from the server
	Zino.fetch('comments.json', function(data) {
		comments = JSON.parse(data) || [];

		// once loaded, notify everyone about the changes
		Zino.trigger('comments-changed', comments);
	});

	Zino.on('comments-initialize', function() {
		// send over the list of comments to anyone listening
		Zino.trigger('comments-changed', comments);
	});

	// when receiving the notification about an added comment
	Zino.on('add-comment', function(comment) {
		// add it to the list of comments
		comments.push(comment);

		// send comments to the server
		// ...

		// once done, trigger the comments-changed event to notify everyone
		Zino.trigger('comments-changed', comments);
	});
}());
