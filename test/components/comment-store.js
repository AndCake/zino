(function() {
	'use strict';

	var comments = [];

	Zino.on('comments-initialize', function() {
		// send over the list of comments to anyone listening
		Zino.trigger('comments-changed', comments);
	});

	// when receiving the notification about an added comment
	Zino.on('comment-added', function(comment) {
		// add it to the list of comments
		comments.push(comment);

		// send comments to the server
		// ...

		// once done, trigger the comments-changed event to notify everyone
		Zino.trigger('comments-changed', comments);
	});
}());
